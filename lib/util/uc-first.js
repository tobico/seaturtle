// Capitalizes the first letter of a string.
export const ucFirst = (s) => {
  const x = String(s);
  return x.substr(0, 1).toUpperCase() + x.substr(1, x.length);
}
