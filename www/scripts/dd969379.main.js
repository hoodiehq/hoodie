(function() {
  var whereTheMagicHappens;

  whereTheMagicHappens = location.protocol + "//" + location.hostname.replace(/^admin/, "api");

  window.hoodie = new Hoodie(whereTheMagicHappens);

  /*
  hoodie.request("GET", "/").done((data) ->
    console.log "hoodie is a go."
    console.log data
  ).fail (error) ->
    console.log "hoodie has an error."
    console.log error
  */


  window.pocket = {
    Models: {},
    Collections: {},
    Views: {},
    Routers: {},
    init: function() {
      console.log("Hello from Backbone! Woop");
      this.app = new pocket.Views.applicationView;
      this.router = new pocket.Routers.ApplicationRouter;
      return Backbone.history.start();
    }
  };

  window.escapeExpression = Handlebars.Utils.escapeExpression;

  $(document).ready(function() {
    return pocket.init();
  });

}).call(this);
