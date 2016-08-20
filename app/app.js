import angular from 'angular';
import 'angular-route';
import 'angular-ui-router';
import fs from 'fastclick';
import 'angular-base-apps/dist/js/base-apps';
import 'angular-base-apps/dist/js/base-apps-templates';
import 'angular-dynamic-routing/dynamicRouting';
import 'angular-dynamic-routing/dynamicRouting.animations';
import 'angular-icons/dist/iconic';
import 'angular-icons/dist/open-iconic';
import 'angular-icons/dist/ionicons';
import 'angular-icons/dist/material-icons';

const AppConfig = ($urlProvider, $locationProvider) => {
  $urlProvider.otherwise('/');

  $locationProvider.html5Mode({
    enabled: false,
    requireBase: false
  });
};

AppConfig.$inject = ['$urlRouterProvider', '$locationProvider'];

const AppRun = () => {
  fs.FastClick.attach(document.body);
};

angular.module('application', [
  'ui.router',

  // base apps
  'base',

  // icons
  'angularIcons.iconic',
  'angularIcons.openIconic',
  'angularIcons.ionicons',
  'angularIcons.materialIcons',

  // dynamic routing
  'dynamicRouting',
  'dynamicRouting.animations'
])
.config(AppConfig)
.run(AppRun);
