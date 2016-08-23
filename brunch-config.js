var gulp = require('gulp');
var router = require('base-apps-router');
var init = true;

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
      if (init) {
        gulp.src('./app/assets/**/*.html')
          .pipe(router({
            path: './public/js/routes.js',
            root: './'
          }))
          .pipe(gulp.dest('./public'));
        init = false;
      }
    }
  }
};
