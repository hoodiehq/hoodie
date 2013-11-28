module.exports = function () {

  return {
    index : this.sandbox.stub(),
    changedObjects : this.sandbox.stub(),
    hasLocalChanges : this.sandbox.stub(),
    clear : this.sandbox.stub(),
    isBootstrapping : this.sandbox.stub(),
    isPersistent : this.sandbox.stub(),
    subscribeToOutsideEvents : this.sandbox.stub(),
    bootstrapDirtyObjects : this.sandbox.stub(),
    patchIfNotPersistant : this.sandbox.stub()
  }
};
