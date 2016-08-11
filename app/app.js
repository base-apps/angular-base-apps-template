import angular from 'angular';
import 'angular-route';
import 'angular-ui-router';
import fs from 'fastclick';
import 'base-apps';
import 'base-apps-templates';

const AppConfig = ($urlProvider, $locationProvider) => {
  $urlProvider.otherwise('/');

  $locationProvider.html5Mode({
    enabled:false,
    requireBase: false
  });
};

AppConfig.$inject = ['$urlRouterProvider', '$locationProvider'];

const AppRun = () => {
  fs.FastClick.attach(document.body);
};

angular.module('application', [
  'ui.router',
  //base
  'base',
  'base.dynamicRouting',
  'base.dynamicRouting.animations'
])
.config(AppConfig)
.run(AppRun);
