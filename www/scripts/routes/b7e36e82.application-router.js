(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  pocket.Routers.ApplicationRouter = (function(_super) {

    __extends(ApplicationRouter, _super);

    function ApplicationRouter() {
      return ApplicationRouter.__super__.constructor.apply(this, arguments);
    }

    ApplicationRouter.prototype.routes = {
      "": "dashboard",
      "users": "users"
    };

    ApplicationRouter.prototype.dashboard = function() {
      return pocket.app.dashboard.active();
    };

    ApplicationRouter.prototype.users = function() {
      return pocket.app.users.active();
    };

    return ApplicationRouter;

  })(Backbone.Router);

}).call(this);
