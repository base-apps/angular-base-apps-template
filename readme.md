# Angular Base Apps Template

This is a starter project for web application based on Angular Base Apps, 
powered by [Babel](https://babeljs.io/) and [Brunch](http://brunch.io). 
It provides you with a sensible defaults to bootstrap your application on a modern
language platform with compile time safety across the entire stack of static resources.

[![Build Status](https://travis-ci.org/base-apps/angular-base-apps-template.svg)](https://travis-ci.org/base-apps/angular-base-apps-template)
[![GitHub version](https://badge.fury.io/gh/base-apps%2Fangular-base-apps-template.svg)](https://badge.fury.io/gh/base-apps%2Fangular-base-apps-template)

## Features
  
  * ES6 by default
  * Reloading of resource on save
  * Modular folder-by-feature architecture
  * Javascript/CSS/HTML minification for production 
  * [Karma](http://karma-runner.github.io) for unit tests
  * [ESlint](http://http://eslint.org) for linting 

## Requirements

You'll need the following software installed to get started.

  - [Node.js](http://nodejs.org): Use the installer for your OS.
  - [Git](http://git-scm.com/downloads): Use the installer for your OS.
    - Windows users can also try [Git for Windows](http://git-for-windows.github.io/).
  

## Get Started

Clone this repository, where `app` is the name of your app.

```bash
git clone git@github.com:base-apps/angular-base-apps-template.git starter
```

Change into the directory.

```bash
cd starter
```

Install the dependencies. If you're running Mac OS or Linux, you may need to run `sudo npm install` instead, depending on how your machine is configured.

```bash
npm install
```

While you're working on your project, run:

```bash
npm start
```

This will compile your front end resource and assemble your Angular app. 
**Now go to `localhost:3333` in your browser to see it in action.** 

To build your app for production, run:

```bash
npm run prod
```

To run unit tests with [karma](http://karma-runner.github.io):

```bash
npm test
```
