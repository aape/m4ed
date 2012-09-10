// Filename: app.js
define([
  'jquery',
  'underscore',
  'backbone',
  'views/editor/itemlist',
  'views/editor/navigation',
  'jquery.hotkeys',
  'bootstrap.collapse',
  'bootstrap.dropdown',
  'bootstrap.modal',
  'bootstrap.transition',
  'bootstrap.button'
], function($, _, Backbone, ItemListView, NavigationView) {
  var initialize = function() {

    // Make a clone of BackBone.Events and use it as a global event dispatcher
    var dispatcher = _.clone(Backbone.Events);

    new ItemListView({
      el: '.container', 
      custom: {
        'globalDispatcher': dispatcher
      }
    });
    
    new NavigationView({
      el: '.navbar-fixed-top',
      custom: {
        'globalDispatcher': dispatcher
      }
    });

  };

  return {
    initialize: initialize
  };

});