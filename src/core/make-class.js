// Creates a new class
export const makeClass = (className, superClass, definition) => {
  const newClass = new Function(`
    var f = function ${className}() {
      this._class = f;
      return this;
    };
    return f;
  `)()

  newClass._classMethods = [];

  // Inherit superclass
  if (superClass && (typeof superClass === 'string')) { superClass = this.getClass(superClass); }
  if (superClass) {
    newClass.prototype = new superClass;
    newClass._superclass = superClass;

    // Inherit class methods
    if (superClass._classMethods) {
      superClass._classMethods.forEach(methodName => {
        newClass[methodName] = superClass[methodName];
        newClass._classMethods.push(methodName);
      })
    }
  }

  // Set _name variable to name of class
  newClass._name = className;

  // Run class definition
  definition(newClass);

  return newClass
}
