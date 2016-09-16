const fs = require('fs');
const router = require('base-apps-router');
const mkdirp = require('mkdirp');

module.exports = {

  conventions: {
    assets:   /^(app)(\\|\/)(assets)/,
    ignored:  [/\/_/, /\.(spec|scenario)\.(js$)/]
  },

  paths: {
    'public':   'build',
    'watched':  ['app']
  },

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
      pattern: /^config-routes\.js$/,
      warnOnly: true
    },
    htmlPages: {
      forceRemoveFrontMatter: true
    }
  },

  hooks: {
    preCompile: (done) => {
      // create config folder
      mkdirp.sync('app/config');

      router({
        src: 'app/**/*.html',
        dest: 'build',
        path: 'app/config/config-routes.js',
        root: 'app',
        library: 'node',
        overwrite: true
      }).then(done);
    }
  }

};
