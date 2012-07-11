describe "Events", ->
  beforeEach ->
    @obj = new Events
  
  describe ".bind(event, callback)", ->
    it "should bind the passed callback to the passed event", ->
      cb = jasmine.createSpy 'test'
      @obj.bind 'test', cb
      @obj.trigger 'test'
      expect(cb).wasCalled()
      
    it "should allow to pass multiple events", ->
      cb = jasmine.createSpy 'test'
      @obj.bind 'test1 test2', cb
      @obj.trigger 'test1'
      @obj.trigger 'test2'
      expect(cb.callCount).toBe 2
  # /.bind(event, callback)

  describe ".one(event, callback)", ->
    it "should bind passed callback to first occurence of passed event", ->
      cb = jasmine.createSpy 'test'
      @obj.one 'test', cb
      @obj.trigger 'test'
      @obj.trigger 'test'
      expect(cb.callCount).toBe 1
  # /.one(event, callback)
  
  describe ".trigger(event, args...)", ->
    it "should call subscribed callbacks", ->
      cb1 = jasmine.createSpy 'test1'
      cb2 = jasmine.createSpy 'test2'
      @obj.bind 'test', cb1
      @obj.bind 'test', cb2
      @obj.trigger 'test'
      expect(cb1).wasCalled()
      expect(cb2).wasCalled()
      
    it "should pass arguments", ->
      cb = jasmine.createSpy 'test'
      @obj.bind 'test', cb
      @obj.trigger 'test', 'arg1', 'arg2', 'arg3'
      expect(cb).wasCalledWith 'arg1', 'arg2', 'arg3'
  # /.trigger(event, args...)

  describe ".unbind(event, callback)", ->
    _when "callback passed", ->
      it "should unsubscribe the callback", ->
        cb = jasmine.createSpy 'test'
        @obj.bind 'test', cb
        @obj.unbind 'test', cb
        @obj.trigger 'test'
        expect(cb).wasNotCalled()
        
    _when "no callback passed", ->
      it "should unsubscribe all callbacks", ->
        cb1 = jasmine.createSpy 'test1'
        cb2 = jasmine.createSpy 'test2'
        @obj.bind 'test', cb1
        @obj.bind 'test', cb2
        @obj.unbind 'test'
        @obj.trigger 'test'
        expect(cb1).wasNotCalled()
        expect(cb2).wasNotCalled()
  # /.unbind(event, callback)