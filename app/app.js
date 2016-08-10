import angular from 'angular';
import 'angular-route';
import 'angular-ui-router';
import fastclick from 'fastclick';
import 'base-apps';
import 'base-apps-templates';

angular.module('application', [
  'ui.router',
  //base
  'base',
  'base.dynamicRouting',
  'base.dynamicRouting.animations'
])
.config(config)
.run(run);

config.$inject = ['$urlRouterProvider', '$locationProvider'];

function config($urlProvider, $locationProvider) {
  $urlProvider.otherwise('/');

  $locationProvider.html5Mode({
    enabled:false,
    requireBase: false
  });

  $locationProvider.hashPrefix('!');
}

function run() {
  fastclick.FastClick.attach(document.body);
}
