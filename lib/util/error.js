export const error = (message) => {
  if (window.console) {
    return console.error(message);
  } else {
    return alert(message);
  }
}
