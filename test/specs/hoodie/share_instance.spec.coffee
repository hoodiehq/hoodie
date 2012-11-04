describe "Hoodie.ShareInstance", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
    @share = new Hoodie.ShareInstance @hoodie, id: 'id123'
    spyOn(@hoodie, "resolveWith").andCallThrough()
    @updateDefer = @hoodie.defer()
    spyOn(@hoodie.share, "update").andReturn @updateDefer.promise()
  
  describe "constructor", ->
    it "should set id from options.id", ->
      share = new Hoodie.ShareInstance @hoodie, id: 'id123'
      expect(share.id).toBe 'id123'

    it "shoudl set name from id", ->
      share = new Hoodie.ShareInstance @hoodie, id: 'id123'
      expect(share.name).toBe 'share/id123'

    it "should generate an id if options.id wasn't passed", ->
      share = new Hoodie.ShareInstance @hoodie
      expect(share.id).toBe 'uuid'

    it "should set options", ->
      share = new Hoodie.ShareInstance @hoodie, funky: 'fresh'
      expect(share.funky).toBe 'fresh'

    it "should default access to false", ->
      share = new Hoodie.ShareInstance @hoodie
      expect(share.access).toBe false
  # /constructor

  describe "#grantReadAccess(users)", ->
    _when "share.access is false", ->
      beforeEach ->
        @share.access = false
      
      _and "no users passed", ->
        beforeEach ->
          @promise = @share.grantReadAccess()
        
        it "should set access to true", ->
          expect(@share.access).toBe true
        
        it "should update share", ->
          expect(@hoodie.share.update).wasCalledWith 'id123', access: true

        it "should return a promise from share.update", ->
          @updateDefer.resolve('funk')
          expect(@promise).toBeResolvedWith 'funk'

      _and "user 'joe@example.com' passed", ->
        beforeEach ->
          @share.grantReadAccess('joe@example.com')
        
        it "should set access to ['joe@example.com']", ->
          expect(@share.access.join()).toBe 'joe@example.com'
        
        it "should update share", ->
          expect(@hoodie.share.update).wasCalledWith 'id123', access: ['joe@example.com']

    _when "share.access is {read: false}", ->
      beforeEach ->
        @share.access = read: false
      
      _and "no users passed", ->
        beforeEach ->
          @promise = @share.grantReadAccess()
        
        it "should set access to true", ->
          expect(@share.access.read).toBe true
        
        it "should update share", ->
          expect(@hoodie.share.update).wasCalledWith 'id123', access: read: true

      _and "user 'joe@example.com' passed", ->
        beforeEach ->
          @share.grantReadAccess('joe@example.com')
        
        it "should set access to ['joe@example.com']", ->
          expect(@share.access.read.join()).toBe 'joe@example.com'
        
        it "should update share", ->
          expect(@hoodie.share.update).wasCalledWith 'id123', access: read: ['joe@example.com']

    for access in [true, read: true]
      _when "share.access is #{JSON.stringify access}", ->
        beforeEach ->
          @share.access = access
          @promise = @share.grantReadAccess()
        
        it "should not call share.update", ->
          expect(@hoodie.share.update).wasNotCalled()

        it "should return a resolved promise", ->
          expect(@hoodie.resolveWith).wasCalledWith @share
          expect(@promise).toBe 'resolved'

    _when "share.access is ['joe@example.com']", ->
      beforeEach ->
        @share.access = ['joe@example.com']
      
      _and "no users passed", ->
        beforeEach ->
          @promise = @share.grantReadAccess()
        
        it "should set access to true", ->
          expect(@share.access).toBe true

      _and "user 'joe@example.com' passed", ->
        beforeEach ->
          @share.grantReadAccess('joe@example.com')
        
        it "should set access to joe@example.com", ->
          expect(@share.access.join()).toBe 'joe@example.com'

      _and "user 'lisa@example.com' passed", ->
        beforeEach ->
          @share.grantReadAccess('lisa@example.com')
        
        it "should set access to true", ->
          expect(@share.access.join(',')).toBe 'joe@example.com,lisa@example.com'
  # /#grantReadAccess(user)
  

  describe "#revokeReadAccess(users)", ->
    _when "share.access is true", ->
      beforeEach ->
        @share.access = true
      
      _and "no users passed", ->
        beforeEach ->
          @promise = @share.revokeReadAccess()
        
        it "should set access to false", ->
          expect(@share.access).toBe false
        
        it "should update share", ->
          expect(@hoodie.share.update).wasCalledWith 'id123', access: false

      _and "user 'joe@example.com' passed", ->
        beforeEach ->
          @promise = @share.revokeReadAccess('joe@example.com')
        
        it "should not change access", ->
          expect(@share.access).toBe true
        
        it "should not update share", ->
          expect(@hoodie.share.update).wasNotCalled()

        it "should return a rejected promise", ->
          expect(@promise).toBe 'rejected'

    _when "share.access is {read: true, write: ['joe@example.com']}", ->
      beforeEach ->
        @share.access = 
          read  : true
          write : ['joe@example.com']

      _and "user 'joe@example.com' passed", ->
        beforeEach ->
          @promise = @share.revokeReadAccess('joe@example.com')
        
        it "should set access to true", ->
          expect(@share.access).toBe true
        
        it "should update share", ->
          expect(@hoodie.share.update).wasCalledWith 'id123', access: true

        it "should return a rejected promise", ->
          expect(@promise).toBe 'rejected'

    _when "share.access is false", ->
      beforeEach ->
        @share.access = false
        @promise = @share.revokeReadAccess()
      
      it "should not call share.update", ->
        expect(@hoodie.share.update).wasNotCalled()

      it "should return a resolved promise", ->
        expect(@hoodie.resolveWith).wasCalledWith @share
        expect(@promise).toBe 'resolved'

    _when "share.access is ['joe@example.com']", ->
      beforeEach ->
        @share.access = ['joe@example.com']
      
      _and "no users passed", ->
        beforeEach ->
          @promise = @share.revokeReadAccess()
        
        it "should set access to false", ->
          expect(@share.access).toBe false

      _and "user 'joe@example.com' passed", ->
        beforeEach ->
          @share.revokeReadAccess('joe@example.com')
        
        it "should set access to false", ->
          expect(@share.access).toBe false

      _and "user 'lisa@example.com' passed", ->
        beforeEach ->
          @share.revokeReadAccess('lisa@example.com')
        
        it "should not change access", ->
          expect(@share.access.join(',')).toBe 'joe@example.com'

        it "should not update in store", ->
          expect(@hoodie.share.update).wasNotCalled()
  # /#revokeReadAccess(user)


  describe "#grantWriteAccess(users)", ->
    _when "share.access is false", ->
      beforeEach ->
        @share.access = false
      
      _and "no users passed", ->
        beforeEach ->
          @promise = @share.grantWriteAccess()
        
        it "should set access to {read: true, write: true}", ->
          expect(@share.access.read).toBe true
          expect(@share.access.write).toBe true
        
        it "should update share", ->
          expect(@hoodie.share.update).wasCalledWith 'id123', access: {read: true, write: true}

      _and "user 'joe@example.com' passed", ->
        beforeEach ->
          @share.grantWriteAccess('joe@example.com')
        
        it "should set access to {read: ['joe@example.com'], write: ['joe@example.com']}", ->
          expect(@share.access.read.join()).toBe 'joe@example.com'
          expect(@share.access.write.join()).toBe 'joe@example.com'
        
        it "should update share", ->
          expect(@hoodie.share.update).wasCalledWith 'id123', access: {read: ['joe@example.com'], write: ['joe@example.com']}

    _when "share.access is {read: true, write: true}", ->
      beforeEach ->
        @share.access = {read: true, write: true}
        @promise = @share.grantWriteAccess()
      
      it "should not call share.update", ->
        expect(@hoodie.share.update).wasNotCalled()

      it "should return a resolved promise", ->
        expect(@hoodie.resolveWith).wasCalledWith @share
        expect(@promise).toBe 'resolved'

    _when "share.access is ['joe@example.com']", ->
      beforeEach ->
        @share.access = ['joe@example.com']
      
      _and "no users passed", ->
        beforeEach ->
          @promise = @share.grantWriteAccess()
        
        it "should set access to {read: true, write: true}", ->
          expect(@share.access.read).toBe true
          expect(@share.access.write).toBe true

      _and "user 'joe@example.com' passed", ->
        beforeEach ->
          @share.grantWriteAccess('joe@example.com')
        
        it "should set access to {read: ['joe@example.com'], write: ['joe@example.com']}", ->
          expect(@share.access.read.join()).toBe 'joe@example.com'
          expect(@share.access.write.join()).toBe 'joe@example.com'

      _and "user 'lisa@example.com' passed", ->
        beforeEach ->
          @share.grantWriteAccess('lisa@example.com')
        
        it "should set access to {read: ['joe@example.com', 'lisa@example.com'], write: ['joe@example.com']}", ->
          expect(@share.access.read.join(',')).toBe 'joe@example.com,lisa@example.com'
          expect(@share.access.write.join(',')).toBe 'lisa@example.com'
  # /#grantWriteAccess(user)


  describe "#revokeWriteAccess(users)", ->
    _when "share.access is true", ->
      beforeEach ->
        @share.access = true
      
      _and "no users passed", ->
        beforeEach ->
          @promise = @share.revokeWriteAccess()
        
        it "should not change access", ->
          expect(@share.access).toBe true
        
        it "should not update share", ->
          expect(@hoodie.share.update).wasNotCalled()

    _when "share.access is {read: true, write: true}", ->
      beforeEach ->
        @share.access = {read: true, write: true}
      
      _and "no users passed", ->
        beforeEach ->
          @promise = @share.revokeWriteAccess()
        
        it "should change access to true", ->
          expect(@share.access).toBe true
        
        it "should not update share", ->
          expect(@hoodie.share.update).wasCalledWith 'id123', access: true

      _and "user 'joe@example.com' passed", ->
        beforeEach ->
          @promise = @share.revokeWriteAccess('joe@example.com')
        
        it "should not change access", ->
          expect(@share.access.read).toBe true
          expect(@share.access.write).toBe true
        
        it "should not update share", ->
          expect(@hoodie.share.update).wasNotCalled()

        it "should return a rejected promise", ->
          expect(@promise).toBe 'rejected'

    _when "share.access is {read: true, write: ['joe@example.com']}", ->
      beforeEach ->
        @share.access = 
          read  : true
          write : ['joe@example.com']

      _and "user 'joe@example.com' passed", ->
        beforeEach ->
          @promise = @share.revokeWriteAccess('joe@example.com')
        
        it "should set access to true", ->
          expect(@share.access).toBe true
        
        it "should update share", ->
          expect(@hoodie.share.update).wasCalledWith 'id123', access: true

    _when "share.access is false", ->
      beforeEach ->
        @share.access = false
        @promise = @share.revokeWriteAccess()
      
      it "should not call share.update", ->
        expect(@hoodie.share.update).wasNotCalled()

      it "should return a resolved promise", ->
        expect(@hoodie.resolveWith).wasCalledWith @share
        expect(@promise).toBe 'resolved'

    _when "share.access is ['joe@example.com']", ->
      beforeEach ->
        @share.access = ['joe@example.com']
      
      _and "no users passed", ->
        beforeEach ->
          @promise = @share.revokeWriteAccess()
        
        it "should not change access", ->
          expect(@share.access.join()).toBe 'joe@example.com'

      _and "user 'joe@example.com' passed", ->
        beforeEach ->
          @share.revokeWriteAccess('joe@example.com')
        
        it "should not change access", ->
          expect(@share.access.join()).toBe 'joe@example.com'

      _and "user 'lisa@example.com' passed", ->
        beforeEach ->
          @share.revokeWriteAccess('lisa@example.com')
        
        it "should not change access", ->
          expect(@share.access.join(',')).toBe 'joe@example.com'

        it "should not update in store", ->
          expect(@hoodie.share.update).wasNotCalled()
  # /#revokeWriteAccess(user)