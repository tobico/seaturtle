export const template = (template, values) => {
  let s = template;
  for (let key in values) {
    const value = values[key];
    if (values.hasOwnProperty(key)) {
      s = s.replace(`:${key}`, value);
    }
  }
  return s;
}
