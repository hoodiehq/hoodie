(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  pocket.Views.dashboardView = (function(_super) {

    __extends(dashboardView, _super);

    function dashboardView() {
      this.render = __bind(this.render, this);
      return dashboardView.__super__.constructor.apply(this, arguments);
    }

    dashboardView.prototype.template = 'dashboard';

    dashboardView.prototype.initialize = function() {
      dashboardView.__super__.initialize.apply(this, arguments);
      return this.setElement($('.main'));
    };

    dashboardView.prototype.active = function() {
      return this.loadStats();
    };

    dashboardView.prototype.loadStats = function() {
      return window.hoodie.admin.stats(1358610679).then(this.render);
    };

    dashboardView.prototype.render = function(stats) {
      this.stats = stats;
      this.$el.html(Handlebars.VM.template(JST[this.template])(this));
      return dashboardView.__super__.render.apply(this, arguments);
    };

    return dashboardView;

  })(Backbone.View);

}).call(this);
