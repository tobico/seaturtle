#= require ST/Storage

Spec.describe "Storage", ->
  describe "#isActive", ->
    it "should be false when storage type is none", ->
      storage = new ST.Storage
      storage._storageType = 'none'
      storage.isActive().should beFalse

    it "should be true when storage type is not none", ->
      storage = new ST.Storage
      storage._storageType = 'database'
      storage.isActive().should beTrue