requirejs.config({
  baseUrl: 'fanstatic/m4ed/js',
  //enforceDefine: true,
  paths: {
    'jquery': 'lib/jquery/jquery.min',
    'jquery.ui': 'https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.18/jquery-ui.min',
    'jquery.ui.touch-punch': 'lib/jquery/jquery.ui.touch-punch',
    'jquery.autoellipsis': 'lib/jquery/jquery.autoellipsis.min',
    'jquery.elastislide': 'lib/jquery/jquery.elastislide',
    'jquery.plugins': 'lib/jquery/jquery.plugins',
    'jquery.fileupload': 'lib/jqueryfileupload/jquery.fileupload',
    'jquery.fileupload-ui': 'lib/jqueryfileupload/jquery.fileupload-ui',
    'jquery.fileupload-fp': 'lib/jqueryfileupload/jquery.fileupload-fp',
    'jquery.textext': 'lib/jquerytextext/textext.core',
    'jquery.textext.tags': 'lib/jquerytextext/textext.plugin.tags',
    'jquery.textext.prompt': 'lib/jquerytextext/textext.plugin.prompt',
    'jquery.textext.focus': 'lib/jquerytextext/textext.plugin.focus',
    'canvas-to-blob': 'lib/jqueryfileupload/canvas-to-blob.min',
    'load-image': 'lib/jqueryfileupload/load-image.min',
    'tmpl': 'lib/jqueryfileupload/tmpl.min',
    'json': 'lib/json/json2',
    'underscore': 'lib/underscore/underscore',
    'backbone': 'lib/backbone/backbone',
    'hogan': 'lib/hogan/hogan',
    'domReady': 'lib/requirejs/domReady',
    'bootstrap.tooltip': '../bootstrap/js/bootstrap-tooltip',
    'bootstrap.popover': '../bootstrap/js/bootstrap-popover',
    'bootstrap.collapse': '../bootstrap/js/bootstrap-collapse',
    'bootstrap.modal': '../bootstrap/js/bootstrap-modal',
    'bootstrap.dropdown': '../bootstrap/js/bootstrap-dropdown',
    'bootstrap.transition': '../bootstrap/js/bootstrap-transition'
    // 'wysiwym': 'views/editor/wysiwym'
  },
  shim: {
    'backbone': {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    // Plugins that aren't wrapped in define() need their dependencies
    // defined in shim config
    'jquery.ui': ['jquery'],
    'jquery.ui.touch-punch': ['jquery.ui'],
    'jquery.autoellipsis': ['jquery'],
    'jquery.elastislide': ['jquery'],
    'jquery.textext': ['jquery'],
    'jquery.textext.tags': ['jquery.textext'],
    'jquery.textext.prompt': ['jquery.textext'],
    'jquery.textext.focus': ['jquery.textext'],
    'bootstrap.collapse': ['jquery'],
    'bootstrap.modal': ['jquery'],
    'bootstrap.dropdown': ['jquery'],
    'bootstrap.transition': ['jquery'],
    'bootstrap.tooltip': ['jquery'],
    'bootstrap.popover': ['bootstrap.tooltip']
    // 'wysiwym': ['jquery', 'bootstrap.tooltip', 'bootstrap.popover']

  }
});

// , 'jquery', 'underscore', 'backbone' , $, _, Backbone
require(['app', 'domReady!'], function(App) {
  App.initialize();
});