# ## ref success
# {
#   to: "jin@beam.org",
#   subject: "Tolle Liste",
#   body: "...",
#   deliveredAt: "2012-05-05 15:00 UTC"
# }

# ## ref error
# {
#   to: "jin@beam.org",
#   subject: "Tolle Liste",
#   body: "...",
#   error: "No such recipient"
# }

describe "Hoodie.Email", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
    @email  = new Hoodie.Email @hoodie
    
    @errorSpy   = jasmine.createSpy 'error'
    @successSpy = jasmine.createSpy 'success'
    
  describe ".send(emailAttributes)", ->  
    beforeEach ->
      @emailAttributes =
        to      : 'jim@be.am'
        subject : 'subject'
        body    : 'body'
      (spyOn @hoodie.my.store, "create").andReturn
        then: (cb) -> cb $.extend {}, @emailAttributes, id: 'abc4567'
    
    it "should reject the promise", ->
      expect( @email.send(@emailAttributes) ).toBePromise()
      
    it "should save the email as object with type: $email", ->
      @email.send(@emailAttributes)
      (expect @hoodie.my.store.create).wasCalledWith('$email', @emailAttributes)
      
    it "should listen to server response", ->
      (spyOn @hoodie, "one")
      @email.send(@emailAttributes)
      (expect @hoodie.one).wasCalled()
      (expect @hoodie.one.mostRecentCall.args[0]).toEqual "remote:updated:$email:abc4567"
    
    _when "email.to is not provided", ->
      beforeEach ->
        @emailAttributes.to = ''
        
      it "should reject the promise", ->          
        promise = @email.send(@emailAttributes)
        promise.fail @errorSpy
        (expect @errorSpy).wasCalledWith($.extend @emailAttributes, {error: 'Invalid email address (empty)'})
        
    _when "email.to is 'invalid'", ->
      beforeEach ->
        @emailAttributes.to = 'invalid'
      
      it "should reject the promise", ->
        promise = @email.send(@emailAttributes)
        promise.fail @errorSpy
        (expect @errorSpy).wasCalledWith($.extend @emailAttributes, {error: 'Invalid email address (invalid)'})
        
    _when "sending email was successful", ->
      beforeEach ->
        @emailResponseAttributes = $.extend {}, @emailAttributes, id: 'abc4567', deliveredAt: "2012-05-05 15:00 UTC"
        (spyOn @hoodie, "one").andCallFake (event, cb) =>
          cb @emailResponseAttributes
        @promise = @email.send(@emailAttributes)
        
      it "should resolve the promise", ->
        @promise.done @successSpy
        (expect @successSpy).wasCalledWith @emailResponseAttributes
        
    _when "sending email had an error", ->
      beforeEach ->
        @emailResponseAttributes = $.extend {}, @emailAttributes, id: 'abc4567', error: "U SPAM!"
        (spyOn @hoodie, "one").andCallFake (event, cb) =>
          cb @emailResponseAttributes
        @promise = @email.send(@emailAttributes)
        
      it "should resolve the promise", ->
        @promise.fail @errorSpy
        (expect @errorSpy).wasCalledWith @emailResponseAttributes
  # /.send(email)
# /Hoodie.Email