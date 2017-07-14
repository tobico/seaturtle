import { Storage } from './storage'

describe("Storage", () => {
  let storage

  beforeEach(() => {
    storage = new Storage()
  })

  describe("#isActive", function() {
    it("should be false when storage type is none", function() {
      storage._storageType = 'none'
      expect(storage.isActive()).toBe(false)
    })

    it("should be true when storage type is not none", function() {
      storage._storageType = 'database'
      expect(storage.isActive()).toBe(true)
    })
  })
})
