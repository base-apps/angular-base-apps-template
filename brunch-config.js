var fs = require('fs');
var router = require('base-apps-router');

module.exports = {
  files: {
    javascripts: {
      joinTo: {
        'js/app.js':  [/^(?!app)/,/^app/]
      }
    },
    stylesheets: { joinTo: '/css/app.css' }
  },

  plugins: {
    babel: { presets: ['es2015'] }
  },

  optimize: false,

  hooks: {
    onCompile: function () {
      router({
        src: './app/assets/**/*.html',
        dest: './public',
        path: './public/js/routes.js',
        root: './app/assets',
        library: 'angular',
        overwrite: true
      });
    }
  }
};
