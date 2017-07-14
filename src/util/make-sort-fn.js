import { toProc } from './to-proc'
import { compare } from './compare'

// Creates an Array.sort compatible callback function from the provided
//  conversion function.
export const makeSortFn = (fn, reverse) => {
  fn = toProc(fn);
  return (a, b) => (
    reverse ? compare(fn(b), fn(a)) : compare(fn(a), fn(b))
  )
}
