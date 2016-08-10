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
  }
};
