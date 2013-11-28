var hoodieConfig = require('../../../src/hoodie/config');
var hoodieMock = require('../../mocks/hoodie');

describe('Hoodie.Config', function() {

  beforeEach(function() {
    // this.hoodie = hoodieMock.apply(this);

    //this.updateOrAddSpy = this.hoodie.store.updateOrAdd.returns('promise');
    //this.hoodie.store.findDefer.resolve({
      //funky: 'fresh'
    //});

    // hoodieConfig( this.hoodie );
    // this.config = this.hoodie.config;
  });

  it('should work', function() {
    expect(this.sandbox).to.be(Object);
  });

  //describe('#set(key, value)', function() {

    //it('should save a $config with key: value', function() {
      //this.config.set('funky', 'fresh!');

      //expect(this.hoodie.store.updateOrAdd).to.be.calledWith('$config', 'hoodie', {
        //funky: 'fresh!'
      //}, {
        //silent: false
      //});
    //});

    //it('should make the save silent for local settings starting with _', function() {
      //this.config.set('_local', 'fresh');

      //expect(this.hoodie.store.updateOrAdd.calledWith('$config', 'hoodie', {
        //_local: 'fresh'
      //}, {
        //silent: true
      //})).to.be.ok();
    //});

  //});

  //describe('#get(key)', function() {

    //it('should get the config using store', function() {
      //expect(this.config.get('funky')).to.eql('fresh');
      //expect(this.hoodie.store.find.called).to.be.ok();
    //});

  //});

  //describe('#unset(key)', function() {

    //it('should unset the config using store', function() {
      //this.config.set('funky', 'fresh');
      //this.config.unset('funky');

      //expect(this.hoodie.store.updateOrAdd.calledWith('$config', 'hoodie', {
        //funky: void 0
      //}, {
        //silent: false
      //})).to.be.ok();
    //});

  //});

});
