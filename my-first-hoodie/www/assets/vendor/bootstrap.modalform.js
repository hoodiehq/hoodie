!function ($) {

  "use strict"; // jshint ;_;

  $( function() {
    var modalId = "modal-form-" + parseInt(Math.random() * 1000, 10);
    var $cont = $('<div id="'+modalId+'"></div>');
    $('body').append( $cont );

    $.modalForm = function(options) {
      var fields = options.fields || [];
      var title  = options.title  || options.submit;
      var submit = options.submit || 'submit';
      var $modal, field, type, html = "";

      html += "<div class=\"modal fade\">";
      html += "  <form class=\"modal-dialog\">";
      html += "    <div class=\"modal-content\">";
      if (title) {
        html += "      <div class=\"modal-header\">";
        html += "        <h3>";
        html += "        "+title;
        html += "          <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">×</button>";
        html += "        </h3>";
        html += "      <\/div>";
      }
      html += "      <div class=\"modal-body\">";
      while (field = fields.shift()) {
        type = /password/.test(field) ? 'password' : 'text';
        html += "        <input class=\"form-control\" type=\""+type+"\" name=\""+field+"\" placeholder=\""+field.replace(/_/g, ' ')+"\"><br \/>";
      }
      html += "      <\/div>";
      html += "      <div class=\"modal-footer\">";
      html += "        <button type=\"submit\" class=\"btn btn-primary\">"+submit+"<\/button>";
      html += "      <\/div>";
      html += "    <\/div>";
      html += "  <\/form>";
      html += "<\/div>";

      // make sure that only one modal is visible
      $modal = $( html );
      $cont.html('').append( $modal );

      $modal.modal();
      $modal.modal('show');

      $modal.on('submit', 'form', function(event){
        event.preventDefault();
        event.stopPropagation();

        var inputs = {};
        var $form = $(event.target);

        $form.find('[name]').each( function () {
          inputs[this.name] = this.value;
        });

        $modal.trigger('submit', inputs);
      });

      $modal.on('error', function(event, error) {
        $modal.find('.alert').remove();
        $modal.find('.modal-body').before('<div class="alert alert-error">'+error.message+'</div>');
      });

      $modal.on('shown', function() {
        $modal.find('input').eq(0).focus()
      })

      return $modal;
    };
  })
}( window.jQuery )
