require('../../../lib/setup');

// stub the requires before loading the actual module
var eventsMixin = sinon.spy();

global.stubRequire('src/lib/events', eventsMixin);
global.unstubRequire('src/lib/store/scoped');

var hoodieScopedStoreApi = require('../../../../src/lib/store/scoped');

describe('hoodieScopedStoreApi', function() {

  beforeEach(function() {
    this.hoodie = this.MOCKS.hoodie.apply(this);
    this.store = this.MOCKS.store.apply(this);

    this.options = this.MOCKS.storeOptions('taskstore');
  });

  _when('scoped with type = "task"', function() {
    beforeEach(function() {
      this.options.type = 'task';
      this.scopedStore = hoodieScopedStoreApi(this.hoodie, this.store, this.options );
    });

    it('scopes save method to type "task"', function() {
      this.scopedStore.save('abc', {title: 'milk!'}, { option: 'some value'});
      expect(this.store.save).to.be.calledWith('task', 'abc', { title: 'milk!'}, { option: 'some value'});
    });

    it('scopes add method to type "task"', function() {
      this.scopedStore.add({title: 'milk!'}, { option: 'some value'});
      expect(this.store.add).to.be.calledWith('task', { title: 'milk!'}, { option: 'some value'});
    });

    it('scopes find method to type "task"', function() {
      this.scopedStore.find('abc');
      expect(this.store.find).to.be.calledWith('task', 'abc');
    });

    it('scopes findOrAdd method to type "task"', function() {
      this.scopedStore.findOrAdd('abc', { title: 'Nutella' });
      expect(this.store.findOrAdd).to.be.calledWith('task', 'abc', { title: 'Nutella' });
    });

    it('scopes findAll method to type "task"', function() {
      this.scopedStore.findAll({option: 'value'});
      expect(this.store.findAll).to.be.calledWith('task', {option: 'value'});
    });

    it('scopes update method to type "task"', function() {
      this.scopedStore.update('abc', { title: 'Nutella' }, {option: 'value'});
      expect(this.store.update).to.be.calledWith('task', 'abc', { title: 'Nutella' }, {option: 'value'});
    });

    it('scopes updateAll method to type "task"', function() {
      this.scopedStore.updateAll({ title: '2 × Nutella' }, {option: 'value'});
      expect(this.store.updateAll).to.be.calledWith('task', { title: '2 × Nutella' }, {option: 'value'});
    });

    it('scopes remove method to type "task"', function() {
      this.scopedStore.remove('abc', {option: 'value'});
      expect(this.store.remove).to.be.calledWith('task', 'abc', {option: 'value'});
    });

    it('scopes removeAll method to type "task"', function() {
      this.scopedStore.removeAll({option: 'value'});
      expect(this.store.removeAll).to.be.calledWith('task', {option: 'value'});
    });

    it('adds event API', function() {
      expect(eventsMixin).to.be.calledWith(this.hoodie, { context : this.scopedStore, namespace: 'taskstore:task' });
    });
  }); // 'when scoped by type only'

  _when('scoped with type = "task" & id = "abc"', function() {
    beforeEach(function() {
      this.options.type = 'task';
      this.options.id = 'abc';
      this.scopedStore = hoodieScopedStoreApi(this.hoodie, this.store, this.options );
    });

    it('scopes save method to type "task" & id "abc"', function() {
      this.scopedStore.save({title: 'milk!'}, { option: 'some value'});
      expect(this.store.save).to.be.calledWith('task', 'abc', { title: 'milk!'}, { option: 'some value'});
    });

    it('does not have an add method', function() {
      expect(this.scopedStore.add).to.be(undefined);
    });

    it('scopes find method to type "task" & id "abc"', function() {
      this.scopedStore.find();
      expect(this.store.find).to.be.calledWith('task', 'abc');
    });

    it('does not have an findOrAdd method', function() {
      expect(this.scopedStore.findOrAdd).to.be(undefined);
    });

    it('does not have an findAll method', function() {
      expect(this.scopedStore.findAll).to.be(undefined);
    });

    it('scopes update method to type "task" & id "abc"', function() {
      this.scopedStore.update({ title: 'Nutella' }, {option: 'value'});
      expect(this.store.update).to.be.calledWith('task', 'abc', { title: 'Nutella' }, {option: 'value'});
    });

    it('does not have an updateAll method', function() {
      expect(this.scopedStore.updateAll).to.be(undefined);
    });

    it('scopes remove method to type "task" & id "abc"', function() {
      this.scopedStore.remove({option: 'value'});
      expect(this.store.remove).to.be.calledWith('task', 'abc', {option: 'value'});
    });

    it('does not have an removeAll method', function() {
      expect(this.scopedStore.removeAll).to.be(undefined);
    });

    it('adds event API', function() {
      expect(eventsMixin).to.be.calledWith(this.hoodie, { context : this.scopedStore, namespace: 'taskstore:task:abc' });
    });
  }); // 'when scoped by type only'
});

