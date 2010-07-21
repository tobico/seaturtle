Screw.Unit(function() {
    describe('STList', function() {
        var list;
    
        before(function() {
            list = STList.create();
            for (var i = 0; i <= 9; i++) {
                list.addAndRelease(mock('Test', {id: i}));
            }
        });
    
        after(function() {
            resolve();
            list.release();
        });
        
        describe('#objectAtIndex', function() {
            it('should return object at specified index', function() {
                expect(list.objectAtIndex(0).id).to(equal, 0);
                expect(list.objectAtIndex(3).id).to(equal, 3);
                expect(list.objectAtIndex(11)).to(be_null);
                expect(list.objectAtIndex(-1)).to(be_null);
            });     
        });
        
        describe('#setObjectAtIndex', function() {
            it('should replace the object at specified index', function() {
                var newObject = mock();
                list.setObjectAtIndex(4, newObject);
                list.objectAtIndex(4).should(be, newObject);
            });
        });
        
        describe('#findObjectByProperty', function() {
            it('should find the first object with matching property', function() {
                list.findObjectByProperty('id', 3).should(be, list.objectAtIndex(3));
                list.findObjectByProperty('id', 6).should(be, list.objectAtIndex(6));
                expect(list.findObjectByProperty('id', -1)).to(be_null);
            });
        });
        
        describe('#indexOfObject', function() {
            it('should return the index of an object in list', function() {
                expect(list.indexOfObject(list.objectAtIndex(4))).to(equal, 4);
            });
            it('should return null for an object not in list', function() {
                expect(list.indexOfObject(mock())).to(be_null);
            });
        });
        
        describe('#count', function() {
            it('should return the number of objects in list', function() {
                expect(list.count()).to(equal, 10);
            });
        });
        
        describe('#first', function() {
            it('should return the first item in list', function() {
                list.first().should(be, list.objectAtIndex(0));
            });
        });
        
        describe('#last', function() {
            it('should return the last item in list', function() {
                list.last().should(be, list.objectAtIndex(9));
            });
        });
        
        describe('#lastIndex', function() {
            it('should return the index of last item in list', function() {
                expect(list.lastIndex()).to(equal, 9);
            });
        });
        
        describe('#add', function() {
            it('should add item to the end of list', function() {
                var item = mock();
                list.add(item);
                list.last().should(be, item);
            });
            it('should retain the item if it responds to retain', function() {
                var item = mock();
                item.shouldReceive('retain');
                list.add(item);
            });
            it('should not retain the item if it doesn\'t respond to retain', function() {
                list.add('Hello'); //Will error if retain() called
            });
        });
        
        describe('#insertObjectAtIndex', function() {
            it('should insert an object with index 0 at the beginning of list', function() {
                var object = mock('Test', {id: -1});
                list.insertObjectAtIndex(object, 0);
        
                expect(list.count()).to(equal, 11);
                expect(list.objectAtIndex(0).id).to(equal, -1);
                expect(list.objectAtIndex(1).id).to(equal, 0);
            });
            it('should insert an object with positive integer index in the middle of list', function() {
                var object = mock('Test', {id: -1});
                list.insertObjectAtIndex(object, 5);
        
                expect(list.count()).to(equal, 11);
                expect(list.objectAtIndex(4).id).to(equal, 4);
                expect(list.objectAtIndex(5).id).to(equal, -1);
                expect(list.objectAtIndex(6).id).to(equal, 5);
            });
        });
        
        describe('#addAndRelease', function() {
            it('should add item to end of list', function() {
                var item = mock();                
                list.addAndRelease(item);
                list.last().should(be, item);
            });
            it('should release item after adding it', function() {
                var item = mock();
                item.shouldReceive('release');
                list.addAndRelease(item);
                expect(item.retainCount).to(equal, 1);
            });
        });
        
        describe('#removeAtIndex', function() {
            it('should remove item at beginning of list', function() {
                list.removeAtIndex(0);
                expect(list.objectAtIndex(0).id).to(equal, 1);
                expect(list.count()).to(equal, 9);
            });
            it('should remove item in the middle of list', function() {
                list.removeAtIndex(5);
                expect(list.objectAtIndex(5).id).to(equal, 6);
                expect(list.count()).to(equal, 9);
            });
            it('should remove item at end of list', function() {
                list.removeAtIndex(9);
                expect(list.objectAtIndex(8).id).to(equal, 8);
                expect(list.count()).to(equal, 9);
            });
        });
        
        describe('removeLast', function() {
            it('should remove item at end of list', function() {
                list.removeLast();
                expect(list.objectAtIndex(8).id).to(equal, 8);
                expect(list.count()).to(equal, 9);
            });
        });
        
        describe('remove', function() {
           it('should remove a found item', function() {
               var item = list.objectAtIndex(5);
               list.remove(item);
               expect(list.objectAtIndex(5).id).to(equal, 6);
               expect(list.count()).to(equal, 9);
           });
           it('should not remove anything if not found', function() {
               list.remove(mock());
               expect(list.count()).to(equal, 10);
           });
        });
        
        describe('copy', function() {
            it('should return an independant copy of list', function() {
                var copy = list.copy();
                copy.add(mock());
                expect(copy.count()).to(equal, 11);
                expect(list.count()).to(equal, 10);
            });
        });
        
        describe('empty', function() {
            it('should remove all items from list', function() {
                list.empty();
                expect(list.count()).to(equal, 0);
            });
            it('should release items before they are removed', function() {
                var item = mock();
                list.add(item);
                item.shouldReceive('release');
                list.empty();
            });
        });
    });
});