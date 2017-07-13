/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST

Spec.describe('ST', function() {
  describe('stringToProc', () =>
    it('should return a function', () => ST.stringToProc('test').should(beAFunction))
  );

  return describe('toProc', function() {
    it('should pass through a function', function() {
      const fn = () => null;
      return ST.toProc(fn).should(be(fn));
    });
  
    return it('should call stringToProc on a string', function() {
      const { stringToProc } = ST;
      ST.shouldReceive('stringToProc').with('test').andReturn(() => null);
      ST.toProc('test').should(beAFunction);
      return ST.stringToProc = stringToProc;
    });
  });
});