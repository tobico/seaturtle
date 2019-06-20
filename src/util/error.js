export const error = (message) => {
  if (typeof console !== 'undefined') {
    return console.error(message);
  } else {
    return alert(message);
  }
}
