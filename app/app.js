// Angular Base Apps Configuration
import fs from 'fastclick';
import angular from 'angular';
import 'angular-base-apps';

// Icon Configuration
import 'angular-icons/dist/open-iconic';
import 'angular-icons/dist/ionicons';
import 'angular-icons/dist/material-icons';

// Route Configuration
import 'angular-dynamic-routing/dynamicRouting';
import 'angular-dynamic-routing/dynamicRouting.animations';
import './config-routes';

// Module Configuration
import './modules/home';

// Application Configuration
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
  'angularIcons.openIconic',
  'angularIcons.ionicons',
  'angularIcons.materialIcons',

  // dynamic routing
  'dynamicRouting',
  'dynamicRouting.animations',

  // modules
  'application.home'
])
.config(AppConfig)
.run(AppRun);
