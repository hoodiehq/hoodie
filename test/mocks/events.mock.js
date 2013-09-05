var Mocks = window.Mocks || {};
Mocks.EventsApi = function (hoodie, options) {
  options.context.trigger = sinon.stub();
  options.context.on = sinon.stub();
  options.context.one = sinon.stub();
  options.context.unbind = sinon.stub();
};
