import { stringToProc } from './string-to-proc'
import { error } from './error'

// Converts an object to a function.
//
// If the passed object is a string, it will be converted using stringToProc.
export const toProc = (object) => {
  if (object.call) {
    return object;
  } else if (typeof object === 'string') {
    return stringToProc(object);
  } else {
    return error('Could not convert object to Proc');
  }
}
