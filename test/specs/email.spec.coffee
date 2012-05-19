define 'specs/email', ['mocks/hoodie', 'email'], (CangMock, Email) ->

  # ## ref success
  # {
  #   to: "jin@beam.org",
  #   subject: "Tolle Liste",
  #   body: "...",
  #   delivered_at: "2012-05-05 15:00 UTC"
  # }
  
  # ## ref error
  # {
  #   to: "jin@beam.org",
  #   subject: "Tolle Liste",
  #   body: "...",
  #   error: "No such recipient"
  # }
  
  describe "Email", ->  
    beforeEach ->
      @app   = new CangMock 
      @email = new Email @app
      
      @errorSpy   = jasmine.createSpy 'error'
      @successSpy = jasmine.createSpy 'success'
      
    describe ".send(email_attributes)", ->  
      beforeEach ->
        @email_attributes =
          to      : 'jim@be.am'
          subject : 'subject'
          body    : 'body'
        (spyOn @app.store, "create").andReturn
          then: (cb) -> cb $.extend {}, @email_attributes, id: 'abc4567'
      
      it "should reject the promise", ->
        expect( @email.send(@email_attributes) ).toBePromise()
        
      it "should save the email as object with type: $email", ->
        @email.send(@email_attributes)
        (expect @app.store.create).wasCalledWith('$email', @email_attributes)
        
      it "should listen to server response", ->
        (spyOn @app, "one")
        @email.send(@email_attributes)
        (expect @app.one).wasCalled()
        (expect @app.one.mostRecentCall.args[0]).toEqual "remote:updated:$email:abc4567"
      
      _when "email.to is not provided", ->
        beforeEach ->
          @email_attributes.to = ''
          
        it "should reject the promise", ->          
          promise = @email.send(@email_attributes)
          promise.fail @errorSpy
          (expect @errorSpy).wasCalledWith($.extend @email_attributes, {error: 'Invalid email address (empty)'})
          
      _when "email.to is 'invalid'", ->
        beforeEach ->
          @email_attributes.to = 'invalid'
        
        it "should reject the promise", ->
          promise = @email.send(@email_attributes)
          promise.fail @errorSpy
          (expect @errorSpy).wasCalledWith($.extend @email_attributes, {error: 'Invalid email address (invalid)'})
          
      _when "sending email was successful", ->
        beforeEach ->
          @email_response_attributes = $.extend {}, @email_attributes, id: 'abc4567', delivered_at: "2012-05-05 15:00 UTC"
          (spyOn @app, "one").andCallFake (event, cb) =>
            cb @email_response_attributes
          @promise = @email.send(@email_attributes)
          
        it "should resolve the promise", ->
          @promise.done @successSpy
          (expect @successSpy).wasCalledWith @email_response_attributes
          
      _when "sending email had an error", ->
        beforeEach ->
          @email_response_attributes = $.extend {}, @email_attributes, id: 'abc4567', error: "U SPAM!"
          (spyOn @app, "one").andCallFake (event, cb) =>
            cb @email_response_attributes
          @promise = @email.send(@email_attributes)
          
        it "should resolve the promise", ->
          @promise.fail @errorSpy
          (expect @errorSpy).wasCalledWith @email_response_attributes
    # /.send(email)
  # /Remote