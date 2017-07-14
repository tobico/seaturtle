// Creates a new class
export const makeClass = (className, superClass, definition) => {
  var newClass = function() {
    this._class = newClass;
    return this;
  };

  newClass._classMethods = [];

  // Inherit superclass
  if (superClass && (typeof superClass === 'string')) { superClass = this.getClass(superClass); }
  if (superClass) {
    newClass.prototype = new superClass;
    newClass._superclass = superClass;

    // Inherit class methods
    for (let methodName of Array.from(superClass._classMethods)) {
      newClass[methodName] = superClass[methodName];
      newClass._classMethods.push(methodName);
    }
  }

  // Set _name variable to name of class
  newClass._name = className;

  // Run class definition
  definition(newClass);

  return newClass
}
