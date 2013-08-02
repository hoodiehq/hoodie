// describe('#checkConnection()', function() {

//   beforeEach(function() {
//     this.requestDefer = this.hoodie.defer();
//     this.hoodie._checkConnectionRequest = null;

//     this.sandbox.stub(this.hoodie, 'request').returns(this.requestDefer.promise());
//     this.sandbox.stub(this.hoodie, 'trigger');
//     window.setTimeout.returns(null);
//   });

//   it('should send GET / request', function() {
//     this.hoodie.checkConnection();
//     expect(this.hoodie.request.calledWith('GET', '/')).to.be.ok();
//   });

//   it('should only send one request at a time', function() {
//     this.hoodie.checkConnection();
//     this.hoodie.checkConnection();
//     expect(this.hoodie.request.callCount).to.eql(1);
//   });

//   _when('hoodie is online', function() {

//     beforeEach(function() {
//       this.hoodie.online = true;
//     });

//     _and('request succeeds', function() {

//       beforeEach(function() {
//         this.requestDefer.resolve({
//           'couchdb': "Welcome",
//           'version': "1.2.1"
//         });
//         this.hoodie.checkConnection();
//       });

//       it('should check again in 30 seconds', function() {
//         expect(window.setTimeout.calledWith(this.hoodie.checkConnection, 30000)).to.be.ok();
//       });

//       it('should not trigger `reconnected` event', function() {
//         expect(this.hoodie.trigger.calledWith('reconnected')).to.not.be.ok();
//       });

//     });

//     _and('request fails', function() {

//       beforeEach(function() {
//         this.requestDefer.reject({
//           'status': 0,
//           'statusText': "Error"
//         });
//         this.hoodie.checkConnection();
//       });

//       it('should check again in 3 seconds', function() {
//         expect(window.setTimeout.calledWith(this.hoodie.checkConnection, 3000)).to.be.ok();
//       });

//       it('should trigger `disconnected` event', function() {
//         expect(this.hoodie.trigger.calledWith('disconnected')).to.be.ok();
//       });

//     });

//   });

//   _when('hoodie is offline', function() {

//     beforeEach(function() {
//       this.hoodie.online = false;
//     });

//     _and('request succeeds', function() {

//       beforeEach(function() {
//         this.requestDefer.resolve({
//           'couchdb': "Welcome",
//           'version': "1.2.1"
//         });
//         this.hoodie.checkConnection();
//       });

//       it('should check again in 30 seconds', function() {
//         expect(window.setTimeout.calledWith(this.hoodie.checkConnection, 30000)).to.be.ok();
//       });

//       it('should trigger `reconnected` event', function() {
//         expect(this.hoodie.trigger.calledWith('reconnected')).to.be.ok();
//       });

//     });

//     _and('request fails', function() {

//       beforeEach(function() {
//         this.requestDefer.reject({
//           'status': 0,
//           'statusText': "Error"
//         });
//         this.hoodie.checkConnection();
//       });

//       it('should check again in 3 seconds', function() {
//         expect(window.setTimeout.calledWith(this.hoodie.checkConnection, 3000)).to.be.ok();
//       });

//       it('should not trigger `disconnected` event', function() {
//         expect(this.hoodie.trigger.calledWith('disconnected')).to.not.be.ok();
//       });

//     });

//   });

// });


// it.skip('should check connection', function() {
//   // we moved this out of the constructor,
//   // you can manually do
//   // hoodie = new Hoodie()
//   // hoodie.checkConnection()
// });