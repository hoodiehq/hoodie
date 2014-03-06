var api = {};

api.clear = sinon.stub();
api.getItem = sinon.stub().returns('item');
api.getObject = sinon.stub().returns({});
api.isPersistent = sinon.stub().returns(true);
api.key = sinon.stub().returns('type/id');
api.length = sinon.stub().returns(0);
api.removeItem = sinon.stub();
api.setItem = sinon.stub();
api.setItem = sinon.stub();
api.setObject = sinon.stub();
api.patchIfNotPersistant = sinon.stub();

// generateId
module.exports = api;
