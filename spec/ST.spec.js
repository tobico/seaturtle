(function() {
  $(function() {
    return ST.Spec.describe('ST', function() {
      describe('stringToProc', function() {
        return it('should return a function', function() {
          return ST.stringToProc('test').should(beAFunction);
        });
      });
      return describe('toProc', function() {
        it('should pass through a function', function() {
          var fn;
          fn = function() {
            return null;
          };
          return ST.toProc(fn).should(be(fn));
        });
        return it('should call stringToProc on a string', function() {
          ST.shouldReceive('stringToProc')["with"]('test').andReturn(function() {
            return null;
          });
          return ST.toProc('test').should(beAFunction);
        });
      });
    });
  });
}).call(this);
