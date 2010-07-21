Screw.Unit(function() {
    describe('STIndexedList', function() {
        var list;
    
        before(function() {
            list = STIndexedList.create();
            for (var i = 0; i <= 9; i++) {
                list.addAndRelease(mock('Test', {id: i}));
            }
        });
    
        after(function() {
            list.release();
        });
    
        describe('indexing', function() {
            it('should link items with prev and next pointers', function() {
                expect(list.objectAtIndex(0).prev).to(be_null);
                list.objectAtIndex(3).next.should(be, list.objectAtIndex(4));
                list.objectAtIndex(3).prev.should(be, list.objectAtIndex(2));
                expect(list.objectAtIndex(9).next).to(be_null);
            });
    
            it('should set the index property for members', function() {
                for (var i = 0; i <= 9; i++) {
                    expect(list.objectAtIndex(i).id).to(equal, i);
                }
            });
        });
    
        describe('#add', function() {   
            it('should add the object, and index it', function() {
                var object = mock('Test', {id: 10});
                list.add(object);
                expect(object.index).to(equal, 10);
                expect(object.next).to(be_null);
                object.prev.should(be, list.objectAtIndex(9));
                object.release();
            });
        });
    
        describe('#renumber', function() {
            it('should regenerate index values', function() {
                list.objectAtIndex(0).index = 7;
                list.objectAtIndex(3).index = 12;
                list.renumber();
                expect(list.objectAtIndex(0).index).to(equal, 0);
                expect(list.objectAtIndex(3).index).to(equal, 3);
                list.objectAtIndex(3).index = 12;
                list.objectAtIndex(4).index = 13;
                list.objectAtIndex(5).index = 14;        list.renumber(4);
                expect(list.objectAtIndex(3).index).to(equal, 12);
                expect(list.objectAtIndex(4).index).to(equal, 4);
                expect(list.objectAtIndex(5).index).to(equal, 5);
            });
        });
    
        describe('#relink', function() {
            it('should be regenerate next and prev links', function() {
                var object = mock('Test', {id: -1});
                list.array[5] = object;
                list.array[0].prev = list.array[9];
                list.array[9].next = list.array[0];
                list.relink();
                list.objectAtIndex(5).prev.should(be, list.objectAtIndex(4));
                list.objectAtIndex(5).next.should(be, list.objectAtIndex(6));
                list.objectAtIndex(6).prev.should(be, list.objectAtIndex(5));
                list.objectAtIndex(4).next.should(be, list.objectAtIndex(5));
                expect(list.objectAtIndex(0).prev).to(be_null);
                expect(list.objectAtIndex(9).next).to(be_null);
                object.release();
            });
        });

        describe('#insertObjectAtIndex', function() {
            it('should insert an object with index 0 at the beginning of list', function() {
                var object = mock('Test', {id: -1});
                list.insertObjectAtIndex(object, 0);
        
                expect(list.count()).to(equal, 11);
                expect(list.objectAtIndex(0).id).to(equal, -1);
                expect(list.objectAtIndex(1).id).to(equal, 0);
        
                expect(list.objectAtIndex(0).index).to(equal, 0);
                expect(list.objectAtIndex(1).index).to(equal, 1);
        
                expect(list.objectAtIndex(0).prev).to(be_null);
                expect(list.objectAtIndex(0).next.id).to(equal, 0);
                expect(list.objectAtIndex(1).prev.id).to(equal, -1);
        
                object.release();
            });
    
            it('should insert an object with positive integer index in the middle of list', function() {
                var object = mock('Test', {id: -1});
                list.insertObjectAtIndex(object, 5);
        
                expect(list.count()).to(equal, 11);
                expect(list.objectAtIndex(4).id).to(equal, 4);
                expect(list.objectAtIndex(5).id).to(equal, -1);
                expect(list.objectAtIndex(6).id).to(equal, 5);
        
                expect(list.objectAtIndex(4).index).to(equal, 4);
                expect(list.objectAtIndex(5).index).to(equal, 5);
                expect(list.objectAtIndex(6).index).to(equal, 6);
        
                expect(list.objectAtIndex(5).prev.id).to(equal, 4);
                expect(list.objectAtIndex(5).next.id).to(equal, 5);
                expect(list.objectAtIndex(6).prev.id).to(equal, -1);
                expect(list.objectAtIndex(4).next.id).to(equal, -1);
      
                object.release();
            });
        });
    });
});