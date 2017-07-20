import { toProc } from './to-proc'

describe('toProc', function() {
  it('should pass through a function', function() {
    const fn = () => null
    expect(toProc(fn)).toBe(fn)
  })

  it('should make a function from a string', function() {
    expect(toProc('test')).toBeInstanceOf(Function)
  })
})
