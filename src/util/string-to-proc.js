// Converts a string to a function returns the named attribute of it's first
// parameter, or (this) object.
//
// If given attribute is a function, it will be called with any additional
// arguments provided to stringToProc, and the result returned.
export const stringToProc = (string, passArgs) => {
  if (passArgs == null) { passArgs = []; }
  return function(o) {
    if (o && (o[string] !== undefined)) {
      if (o[string] && o[string].apply) {
        return o[string].apply(o, passArgs);
      } else {
        return o[string];
      }
    } else {
      return null;
    }
  };
}
