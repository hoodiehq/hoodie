(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  pocket.Views.usersView = (function(_super) {

    __extends(usersView, _super);

    function usersView() {
      this.render = __bind(this.render, this);
      return usersView.__super__.constructor.apply(this, arguments);
    }

    usersView.prototype.template = 'users';

    usersView.prototype.initialize = function() {
      usersView.__super__.initialize.apply(this, arguments);
      return this.setElement($('.main'));
    };

    usersView.prototype.active = function() {
      return this.loadUsers();
    };

    usersView.prototype.loadUsers = function() {
      return window.hoodie.admin.users.findAll().then(this.render);
    };

    usersView.prototype.render = function(users) {
      this.users = users;
      this.$el.html(Handlebars.VM.template(JST[this.template])(this));
      return usersView.__super__.render.apply(this, arguments);
    };

    return usersView;

  })(Backbone.View);

}).call(this);
