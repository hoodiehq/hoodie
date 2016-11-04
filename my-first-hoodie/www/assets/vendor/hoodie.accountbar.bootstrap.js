!function ($) {

  'use strict';

  // extend Hoodie with Hoodstrap module
  Hoodie.extend(function(hoodie) {

    // Constructor
    function Hoodstrap(hoodie) {

      this.hoodie = hoodie;

      // all about authentication and stuff
      this.hoodifyAccountBar();
    }

    Hoodstrap.prototype = {

      //
      hoodifyAccountBar: function() {
        this.subscribeToHoodieEvents();
        this.hoodie.account.authenticate().then(this.handleUserAuthenticated.bind(this), this.handleUserUnauthenticated.bind(this));
      },

      subscribeToHoodieEvents : function() {
        this.hoodie.account.on('signup changeusername signin reauthenticated', this.handleUserAuthenticated.bind(this));
        this.hoodie.account.on('signout', this.handleUserUnauthenticated.bind(this));
        this.hoodie.on('account:error:unauthenticated remote:error:unauthenticated', this.handleUserAuthenticationError.bind(this));
      },

      //
      handleUserAuthenticated: function(username) {
        $('html').attr('data-hoodie-account-status', 'signedin');
        $('.hoodie-accountbar').find('.hoodie-username').text(username);
      },

      //
      handleUserUnauthenticated: function() {
        if (this.hoodie.account.username) {
          return this.handleUserAuthenticationError();
        }
        $('html').attr('data-hoodie-account-status', 'signedout');
      },
      handleUserAuthenticationError: function() {
        $('.hoodie-accountbar').find('.hoodie-username').text(this.hoodie.account.username);
        $('html').attr('data-hoodie-account-status', 'error');
      }
    };

    new Hoodstrap(hoodie);
  });

 /* Hoodie DATA-API
  * =============== */

  $(function () {

    // bind to click events
    $('body').on('click.hoodie.data-api', '[data-hoodie-action]', function(event) {
      var $element = $(event.target),
          action   = $element.data('hoodie-action'),
          $form;

      switch(action) {
        case 'signup':
          $form = $.modalForm({
            fields: [ 'username', 'password', 'password_confirmation' ],
            submit: 'Sign Up'
          });
          break;
        case 'signin':
          $form = $.modalForm({
            fields: [ 'username', 'password' ],
            submit: 'Sign in'
          });
          break;
        case 'resetpassword':
          $form = $.modalForm({
            fields: [ 'username' ],
            submit: 'Reset Password'
          });
          break;
        case 'changepassword':
          $form = $.modalForm({
            fields: [ 'current_password', 'new_password' ],
            submit: 'Change Password'
          });
          break;
        case 'changeusername':
          $form = $.modalForm({
            fields: [ 'current_password', 'new_username' ],
            submit: 'Change Username'
          });
          break;
        case 'signout':
          window.hoodie.account.signOut();
          break;
        case 'destroy':
          if( window.confirm('you sure?') ) {
            window.hoodie.account.destroy();
          }
          break;
      }

      if ($form) {
        $form.on('submit', handleSubmit( action ));
      }
    });

    var handleSubmit = function(action) {
      return function(event, inputs) {

        var $modal = $(event.target);
        var magic;

        switch(action) {
          case 'signin':
            magic = window.hoodie.account.signIn(inputs.username, inputs.password);
            break;
          case 'signup':
            magic = window.hoodie.account.signUp(inputs.username, inputs.password);
            break;
          case 'changepassword':
            magic = window.hoodie.account.changePassword(inputs.current_password, inputs.new_password);
            break;
          case 'changeusername':
            magic = window.hoodie.account.changeUsername(inputs.current_password, inputs.new_username);
            break;
          case 'resetpassword':
            magic = window.hoodie.account.resetPassword(inputs.email)
            .done(function() {
              window.alert('send new password to ' + inputs.email);
            });
            break;
        }

        magic.done(function() {
          $modal.find('.alert').remove();
          $modal.modal('hide');
        });
        magic.fail(function(error) {
          $modal.find('.alert').remove();
          $modal.trigger('error', error);
        });
      };
    };
  });
}( window.jQuery );
