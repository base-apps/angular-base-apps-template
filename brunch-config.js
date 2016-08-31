var fs = require('fs');
var router = require('base-apps-router');

module.exports = {
  files: {
    javascripts: {
      joinTo: {
        'js/app.js':  [/^app/,"!**/*.spec.js"],
        'js/vendor.js':  [/^(?!app)/,/^(?!test)/,"!**/*.spec.js"]
      }
    },
    stylesheets: {
      joinTo: '/css/app.css'
    }
  },

  plugins: {
    babel: {
      presets: ['es2015']
    },
    htmlPages: {
      forceRemoveFrontMatter: true
    }
  },

  optimize: false,

  hooks: {
    preCompile: (done) => {
      router({
        src: 'app/**/*.html',
        dest: 'build',
        path: 'app/config/config-routes.js',
        root: 'app',
        library: 'angular',
        overwrite: true
      }).then(done);
    },

    // TODO: Remove once htmlPages supports forceRemoveFrontMatter option
    onCompile: function () {
      router({
        src: './public/**/*.html',
        dest: './public',
        path: './build/routes.js',
        root: './public',
        library: 'angular',
        overwrite: true
      });
    }
  },

  overrides: {
    production: {
      optimize: true
    }
  }
};
