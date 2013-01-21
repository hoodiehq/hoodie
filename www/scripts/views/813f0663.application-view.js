(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  pocket.Views.applicationView = (function(_super) {

    __extends(applicationView, _super);

    function applicationView() {
      return applicationView.__super__.constructor.apply(this, arguments);
    }

    applicationView.prototype.events = {
      "click a": "handleLinks"
    };

    applicationView.prototype.initialize = function() {
      applicationView.__super__.initialize.apply(this, arguments);
      this.setElement($('html'));
      this.dashboard = new pocket.Views.dashboardView;
      return this.users = new pocket.Views.usersView;
    };

    applicationView.prototype.handleLinks = function(event) {
      var path;
      path = $(this).attr('href');
      if (/\.pdf$/.test(path)) {
        return true;
      }
      if (/^\/[^\/]/.test(path)) {
        router.navigate(path.substr(1), true);
        return false;
      }
    };

    return applicationView;

  })(Backbone.View);

}).call(this);
