Screw.Unit(function() {
  describe('STIndexedArray', function() {
  	var array;
	
  	before(function() {
  		array = STIndexedArray.create();
  		for (var i = 0; i <= 9; i++) {
              array.addAndRelease(mock('Test', {id: i}));
          }
  	});
	
  	after(function() {
  		array.release();
  	});
	
  	describe('#objectAtIndex', function() {
  		it('should return object at specified index', function() {
  			expect(array.objectAtIndex(0).id).to(equal, 0);
  			expect(array.objectAtIndex(3).id).to(equal, 3);
  			expect(array.objectAtIndex(11)).to(be_null);
  			expect(array.objectAtIndex(-1)).to(be_null);
  		});		
  	});
	
  	describe('indexing', function() {
  		it('should link items with prev and next pointers', function() {
  			expect(array.objectAtIndex(0).prev).to(be_null);
  			array.objectAtIndex(3).next.should(be, array.objectAtIndex(4));
  			array.objectAtIndex(3).prev.should(be, array.objectAtIndex(2));
  			expect(array.objectAtIndex(9).next).to(be_null);
  		});
	
  		it('should set the index property for members', function() {
  	    for (var i = 0; i <= 9; i++) {
  				expect(array.objectAtIndex(i).id).to(equal(i));
  	    }
  	  });
  	});

  	describe('#findObjectByProperty', function() {
  		it('should find the first object with matching property', function() {
  			array.findObjectByProperty('id', 3).should(be, array.objectAtIndex(3));
  			array.findObjectByProperty('id', 6).should(be, array.objectAtIndex(6));
  			expect(array.findObjectByProperty('id', -1)).to(be_null);
  		});
  	});
	
  	describe('#add', function() {	
  		it('should add the object, and index it', function() {
  			var object = mock('Test', {id: 10});
  			array.add(object);
  			expect(object.index).to(equal, 10);
  			expect(object.next).to(be_null);
  			object.prev.should(be, array.objectAtIndex(9));
  			object.release();
  		});
  	});
	
  	describe('#renumber', function() {
  		it('should regenerate index values', function() {
  	    array.objectAtIndex(0).index = 7;
  	    array.objectAtIndex(3).index = 12;
  	    array.renumber();
  			expect(array.objectAtIndex(0).index).to(equal, 0);
  			expect(array.objectAtIndex(3).index).to(equal, 3);
  	    array.objectAtIndex(3).index = 12;
        array.objectAtIndex(4).index = 13;
  	    array.objectAtIndex(5).index = 14;        array.renumber(4);
  			expect(array.objectAtIndex(3).index).to(equal, 12);
  			expect(array.objectAtIndex(4).index).to(equal, 4);
  			expect(array.objectAtIndex(5).index).to(equal, 5);
  	  });
  	});
	
  	describe('#relink', function() {
  	  it('should be regenerate next and prev links', function() {
        var object = mock('Test', {id: -1});
        array.array[5] = object;
        array.array[0].prev = array.array[9];
        array.array[9].next = array.array[0];
        array.relink();
        array.objectAtIndex(5).prev.should(be, array.objectAtIndex(4));
        array.objectAtIndex(5).next.should(be, array.objectAtIndex(6));
        array.objectAtIndex(6).prev.should(be, array.objectAtIndex(5));
        array.objectAtIndex(4).next.should(be, array.objectAtIndex(5));
        expect(array.objectAtIndex(0).prev).to(be_null);
        expect(array.objectAtIndex(9).next).to(be_null);
        object.release();
      });
    });

    describe('#insertObjectAtIndex', function() {
  	  it('should insert an object with index 0 at the beginning of array', function() {
    		var object = mock('Test', {id: -1});
    		array.insertObjectAtIndex(object, 0);
		
    		expect(array.count()).to(equal, 11);
    		expect(array.objectAtIndex(0).id).to(equal, -1);
    		expect(array.objectAtIndex(1).id).to(equal, 0);
		
    		expect(array.objectAtIndex(0).index).to(equal, 0);
    		expect(array.objectAtIndex(1).index).to(equal, 1);
		
    		expect(array.objectAtIndex(0).prev).to(be_null);
    		expect(array.objectAtIndex(0).next.id).to(equal, 0);
    		expect(array.objectAtIndex(1).prev.id).to(eqaul, -1);
		
    		object.release();
    	});
    
  	  it('should insert an object with positive integer index in the middle of array', function() {
    		var object = mock('Test', {id: -1});
        array.insertObjectAtIndex(object, 5);
        
    		expect(array.count()).to(equal, 11);
    		expect(array.objectAtIndex(4).id).to(equal, 4);
    		expect(array.objectAtIndex(5).id).to(eqaul, -1);
    		expect(array.objectAtIndex(6).id).to(eqaul, 5);
        
    		expect(array.objectAtIndex(4).index).to(equal, 4);
    		expect(array.objectAtIndex(5).index).to(equal, 5);
    		expect(array.objectAtIndex(6).index).to(equal, 6);
        
    		expect(array.objectAtIndex(5).prev.id).to(equal, 4);
    		expect(array.objectAtIndex(5).next.id).to(equal, 5);
    		expect(array.objectAtIndex(6).prev.id).to(equal, -1);
    		expect(array.objectAtIndex(4).next.id).to(eqaul, -1);
      
        object.release();
    	});
    });
  });
});