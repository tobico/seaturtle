import jQuery from 'jquery'

import { ViewHelper } from './view-helper'

describe("ViewHelper", function() {
  let helper

  beforeEach(function() {
    helper = ViewHelper.instance()
  })
  
  it("should be a singleton", function() {
    expect(ViewHelper.instance()).toBe(helper)
  })
  
  describe("#tag", function() {
    it("should create a jQuery object", function() {
      const tag = helper.tag('span')
      expect(tag).toBeInstanceOf(jQuery)
    })
      
    it("should have the specified type", function() {
      const tag = helper.tag('span')
      expect(tag[0].tagName).toEqual('SPAN')
    })
  })
  
  describe("#linkTag", function() {
    it("should create an A tag", function() {
      const tag = helper.linkTag('Test', () => null)
      expect(tag[0].tagName).toEqual('A')
    })
    
    it("should have the specified text", function() {
      const tag = helper.linkTag('Test', () => null)
      expect(tag.html()).toEqual('Test')
    })
    
    it("should call the supplied callback when link clicked", function() {
      let called = false
      const tag = helper.linkTag('Test', () => { called = true })
      tag.click()
      expect(called).toBe(true)
    })
  })
  
  describe("#truncate", function() {
    it("should pass through short text", function() {
      expect(helper.truncate('bananas', 10)).toEqual('bananas')
    })
    
    it("should truncate long text", function() {
      expect(helper.truncate('bananas and pears', 10)).toEqual('bananas...')
    })
  })
  
  describe("#printHTML", () => it("can't be tested"))
})
