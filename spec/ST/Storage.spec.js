/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//= require ST/Storage

Spec.describe("Storage", () =>
  describe("#isActive", function() {
    it("should be false when storage type is none", function() {
      const storage = new ST.Storage;
      storage._storageType = 'none';
      return storage.isActive().should(beFalse);
    });

    return it("should be true when storage type is not none", function() {
      const storage = new ST.Storage;
      storage._storageType = 'database';
      return storage.isActive().should(beTrue);
    });
  })
);