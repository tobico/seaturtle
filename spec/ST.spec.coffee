$ ->
  ST.Spec.describe 'ST', ->
    describe 'stringToProc', ->
      it 'should return a function', ->
        ST.stringToProc('test').should beAFunction
  
    describe 'toProc', ->
      it 'should pass through a function', ->
        fn = -> null
        ST.toProc(fn).should be(fn)
    
      it 'should call stringToProc on a string', ->
        ST.shouldReceive('stringToProc').with('test').andReturn -> null
        ST.toProc('test').should beAFunction