const fs = require('fs');
const router = require('base-apps-router');
const mkdirp = require('mkdirp');

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
    eslint: {
      // do not fail build when running against config-routes.js
      pattern: /^app\/config\/config-routes\.js$/,
      warnOnly: true
    },
    htmlPages: {
      forceRemoveFrontMatter: true
    }
  },

  optimize: false,

  hooks: {
    preCompile: (done) => {
      // create config folder
      mkdirp.sync('app/config');

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
