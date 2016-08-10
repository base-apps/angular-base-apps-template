(function() {
  'use strict';

  angular.module('foundation.core.animation', [])
    .service('FoundationAnimation', FoundationAnimation)
  ;

  angular.module('base.core.animation', [])
    .service('FoundationAnimation', FoundationAnimation)
  ;

  FoundationAnimation.$inject = ['$q'];

  function FoundationAnimation($q) {
    var animations = [];
    var service = {};

    var initClasses        = ['ng-enter', 'ng-leave'];
    var activeClasses      = ['ng-enter-active', 'ng-leave-active'];
    var activeGenericClass = 'is-active';
    var events = [
      'webkitAnimationEnd', 'mozAnimationEnd',
      'MSAnimationEnd', 'oanimationend',
      'animationend', 'webkitTransitionEnd',
      'otransitionend', 'transitionend'
    ];

    service.animate = animate;
    service.toggleAnimation = toggleAnimation;

    return service;

    function toggleAnimation(element, futureState) {
      if(futureState) {
        element.addClass(activeGenericClass);
      } else {
        element.removeClass(activeGenericClass);
      }
    }

    function animate(element, futureState, animationIn, animationOut) {
      var animationTimeout;
      var deferred = $q.defer();
      var timedOut = true;
      var self = this;
      self.cancelAnimation = cancelAnimation;

      var animationClass = futureState ? animationIn: animationOut;
      var activation = futureState;
      var initClass = activation ? initClasses[0] : initClasses[1];
      var activeClass = activation ? activeClasses[0] : activeClasses[1];

      run();
      return deferred.promise;

      function run() {
        //stop animation
        registerElement(element);
        reset();
        element.addClass(animationClass);
        element.addClass(initClass);

        element.addClass(activeGenericClass);

        //force a "tick"
        reflow();

        //activate
        element[0].style.transitionDuration = '';
        element.addClass(activeClass);

        element.on(events.join(' '), eventHandler);

        animationTimeout = setTimeout(function() {
          if(timedOut) {
            finishAnimation();
          }
        }, 3000);
      }

      function eventHandler(e) {
        if (element[0] === e.target) {
          clearTimeout(animationTimeout);
          finishAnimation();
        }
      }

      function finishAnimation() {
        deregisterElement(element);
        reset(); //reset all classes
        element[0].style.transitionDuration = '';
        element.removeClass(!activation ? activeGenericClass : ''); //if not active, remove active class
        reflow();
        timedOut = false;
        element.off(events.join(' '), eventHandler);
        deferred.resolve({element: element, active: activation});
      }

      function cancelAnimation(element) {
        deregisterElement(element);
        angular.element(element).off(events.join(' ')); //kill all animation event handlers
        timedOut = false;
        deferred.reject();
      }

      function registerElement(el) {
        var elObj = {
          el: el,
          animation: self
        };

        //kill in progress animations
        var inProgress = animations.filter(function(obj) {
          return obj.el === el;
        });
        if(inProgress.length > 0) {
          var target = inProgress[0].el[0];

          inProgress[0].animation.cancelAnimation(target);
        }

        animations.push(elObj);
      }

      function deregisterElement(el) {
        var index;
        var currentAnimation = animations.filter(function(obj, ind) {
          if(obj.el === el) {
            index = ind;
          }
        });

        if(index >= 0) {
          animations.splice(index, 1);
        }

      }

      function reflow() {
        return element[0].offsetWidth;
      }

      function reset() {
        element[0].style.transitionDuration = 0;
        element.removeClass(initClasses.join(' ') + ' ' + activeClasses.join(' ') + ' ' + animationIn + ' ' + animationOut);
      }
    }
  }

})();

(function() {
  'use strict';

  angular.module('foundation.core', [
      'foundation.core.animation'
    ])
    .service('FoundationApi', FoundationApi)
    .service('FoundationAdapter', FoundationAdapter)
    .factory('Utils', Utils)
    .run(Setup);
  ;


  angular.module('base.core', [
      'base.core.animation'
    ])
    .service('FoundationApi', FoundationApi)
    .service('FoundationAdapter', FoundationAdapter)
    .factory('Utils', Utils)
    .run(Setup);
  ;

  FoundationApi.$inject = ['FoundationAnimation'];

  function FoundationApi(FoundationAnimation) {
    var listeners  = {};
    var settings   = {};
    var uniqueIds  = [];
    var service    = {};

    service.subscribe           = subscribe;
    service.unsubscribe         = unsubscribe;
    service.publish             = publish;
    service.getSettings         = getSettings;
    service.modifySettings      = modifySettings;
    service.generateUuid        = generateUuid;
    service.toggleAnimate       = toggleAnimate;
    service.closeActiveElements = closeActiveElements;
    service.animate             = animate;
    service.animateAndAdvise    = animateAndAdvise;

    return service;

    function subscribe(name, callback) {
      if (!listeners[name]) {
        listeners[name] = [];
      }

      listeners[name].push(callback);
      return true;
    }

    function unsubscribe(name, callback) {
      var listenerIndex = -1, i, resizeListeners;

      if (listeners[name] !== undefined) {
        if (name == 'resize') {
          resizeListeners = listeners['resize'];
          for (i = 0; i < resizeListeners.length; i++) {
            if (resizeListeners[i] === callback) {
              // listener found
              listenerIndex = i;
              break;
            }
          }

          if (listenerIndex != -1) {
            // remove listener
            resizeListeners.splice(listenerIndex, 1);
          }
        } else {
          // delete all listeners
          delete listeners[name];
        }
      }
      if (typeof callback == 'function') {
          callback.call(this);
      }
    }

    function publish(name, msg) {
      if (!listeners[name]) {
        listeners[name] = [];
      }

      listeners[name].forEach(function(cb) {
        cb(msg);
      });

      return;
    }

    function getSettings() {
      return settings;
    }

    function modifySettings(tree) {
      settings = angular.extend(settings, tree);
      return settings;
    }

    function generateUuid() {
      var uuid = '';

      //little trick to produce semi-random IDs
      do {
        uuid += 'zf-uuid-';
        for (var i=0; i<15; i++) {
          uuid += Math.floor(Math.random()*16).toString(16);
        }
      } while(!uniqueIds.indexOf(uuid));

      uniqueIds.push(uuid);
      return uuid;
    }

    function toggleAnimate(element, futureState) {
      FoundationAnimation.toggleAnimate(element, futureState);
    }

    function closeActiveElements(options) {
      var self = this;
      options = options || {};
      var activeElements = document.querySelectorAll('.is-active[zf-closable]');
      // action sheets are nested zf-closable elements, so we have to target the parent
      var nestedActiveElements = document.querySelectorAll('[zf-closable] > .is-active');

      if (activeElements.length) {
        angular.forEach(activeElements, function(el) {
          if (options.exclude !== el.id) {
            self.publish(el.id, 'close');
          }
        });
      }
      if (nestedActiveElements.length) {
        angular.forEach(nestedActiveElements, function(el) {
          var parentId = el.parentNode.id;
          if (options.exclude !== parentId) {
            self.publish(parentId, 'close');
          }
        });
      }
    }

    function animate(element, futureState, animationIn, animationOut) {
      return FoundationAnimation.animate(element, futureState, animationIn, animationOut);
    }

    function animateAndAdvise(element, futureState, animationIn, animationOut) {
      var msgPrefix = "animation-" + (futureState ? "open" : "close");
      publish(element[0].id, msgPrefix + "-started");
      var promise = FoundationAnimation.animate(element, futureState, animationIn, animationOut);
      promise.then(function() {
        publish(element[0].id, msgPrefix + "-finished");
      }, function() {
        publish(element[0].id, msgPrefix + "-aborted");
      });
      return promise;
    }
  }

  FoundationAdapter.$inject = ['FoundationApi'];

  function FoundationAdapter(foundationApi) {

    var service    = {};

    service.activate = activate;
    service.deactivate = deactivate;

    return service;

    function activate(target) {
      foundationApi.publish(target, 'show');
    }

    function deactivate(target) {
      foundationApi.publish(target, 'hide');
    }
  }


  function Utils() {
    var utils = {};

    utils.throttle = throttleUtil;

    return utils;

    function throttleUtil(func, delay) {
      var timer = null;

      return function () {
        var context = this, args = arguments;

        if (timer === null) {
          timer = setTimeout(function () {
            func.apply(context, args);
            timer = null;
          }, delay);
        }
      };
    }
  }

  function Setup() {
    // Attach FastClick
    if (typeof(FastClick) !== 'undefined') {
      FastClick.attach(document.body);
    }

    // Attach viewport units buggyfill
    if (typeof(viewportUnitsBuggyfill) !== 'undefined') {
      viewportUnitsBuggyfill.init();
    }
  }

})();

(function() {
  'use strict';

  angular.module('foundation.dynamicRouting.animations', ['foundation.dynamicRouting'])
    .directive('uiView', uiView)
  ;

  angular.module('base.dynamicRouting.animations', ['base.dynamicRouting'])
    .directive('uiView', uiView)
  ;

  uiView.$inject = ['$rootScope', '$state'];

  function uiView($rootScope, $state) {
    var directive = {
      restrict : 'ECA',
      priority : -400,
      link     : link
    };

    return directive;

    function link(scope, element) {
      var animation = {};
      var animationEnded = false;
      var presetHeight;

      var cleanup = [
        $rootScope.$on('$stateChangeStart', onStateChangeStart),
        $rootScope.$on('$stateChangeError', onStateChangeError),
        scope.$on('$stateChangeSuccess', onStateChangeSuccess),
        scope.$on('$viewContentAnimationEnded', onViewContentAnimationEnded)
      ];

      var destroyed = scope.$on('$destroy', function onDestroy() {
        angular.forEach(cleanup, function (cb) {
          if (angular.isFunction(cb)) {
            cb();
          }
        });

        destroyed();
      });

      function onStateChangeStart(event, toState, toParams, fromState, fromParams) {

        if (fromState.animation) {
          if (!fromState.animation.leave && !toState.animation.leave) {
            return;
          }
          else {
             animationRouter(event, toState, fromState);
          }
        }
      }

      function animationRouter(event, toState, fromState) {
        if (!animationEnded) {
          resetParent();
          prepareParent();

          element.removeClass(fromState.animation.leave);
        }
        else {
          prepareParent();

          element.addClass(fromState.animation.leave);
        }

      }

      function onStateChangeError() {
        if(animation.leave) {
          element.removeClass(animation.leave);
        }

        resetParent(); //reset parent if state change fails
      }

      function onStateChangeSuccess() {
        resetParent();
        if ($state.includes(getState()) && animation.enter) {
          element.addClass(animation.enter);
        }
      }

      function onViewContentAnimationEnded(event) {
        if (event.targetScope === scope && animation.enter) {
          element.removeClass(animation.enter);
        }

        animationEnded = true;

      }

      function getState() {
        var view  = element.data('$uiView');
        var state = view && view.state && view.state.self;

        if (state) {
          angular.extend(animation, state.animation);
        }

        return state;
      }

      function resetParent() {
        element.parent().removeClass('position-absolute');
        if(element.parent()[0] && presetHeight !== true) {
          element.parent()[0].style.height = null;
        }
      }

      function prepareParent() {
        if (element.parent()[0]) {
          var parentHeight = parseInt(element.parent()[0].style.height);
          var elHeight = parseInt(window.getComputedStyle(element[0], null).getPropertyValue('height'));
          var tempHeight = parentHeight > 0 ? parentHeight : elHeight > 0 ? elHeight : '';

          if(parentHeight > 0) {
            presetHeight = true;
          }

          element.parent()[0].style.height = tempHeight + 'px';
          element.parent().addClass('position-absolute');
        }
      }
    }
  }

})();

(function() {
  'use strict';

  angular.module('foundation.dynamicRouting', ['ui.router'])
    .provider('$FoundationState', FoundationState)
    .controller('DefaultController', DefaultController)
    .config(DynamicRoutingConfig)
    .run(DynamicRoutingRun)
  ;

  angular.module('base.dynamicRouting', ['ui.router'])
    .provider('$FoundationState', FoundationState)
    .controller('DefaultController', DefaultController)
    .config(DynamicRoutingConfig)
    .run(DynamicRoutingRun)
  ;

  FoundationState.$inject = ['$stateProvider'];

  function FoundationState($stateProvider) {
    var complexViews = {};

    this.registerDynamicRoutes = function(routes) {
      var dynamicRoutes = routes || foundationRoutes;

      angular.forEach(dynamicRoutes, function(page) {
        if (page.hasComposed) {
          if (!angular.isDefined(complexViews[page.parent])) {
            complexViews[page.parent] = { children: {} };
          }

          if (page.controller) {
            page.controller = getController(page);
          }

          complexViews[page.parent].children[page.name] = page;

        } else if (page.composed) {
          if(!angular.isDefined(complexViews[page.name])) {
            complexViews[page.name] = { children: {} };
          }

          if (page.controller) {
            page.controller = getController(page);
          }

          angular.extend(complexViews[page.name], page);
        } else {
          var state = {
            url: page.url,
            templateUrl: page.path,
            abstract: page.abstract || false,
            parent: page.parent || '',
            controller: getController(page),
            data: getData(page),
            animation: buildAnimations(page),
            resolve: {}
          };

          $stateProvider.state(page.name, state);
        }
      });

      angular.forEach(complexViews, function(page) {
          var state = {
            url: page.url,
            parent: page.parent || '',
            abstract: page.abstract || false,
            data: getData(page),
            animation: buildAnimations(page),
            views: {
              '': buildState(page.path, page)
            }
          };

          angular.forEach(page.children, function(sub) {
            state.views[sub.name + '@' + page.name] = buildState(sub.path, page);
          });

          $stateProvider.state(page.name, state);
      });
    };

    this.$get = angular.noop;

    function getData(page) {
      var data = { vars: {} };
      if (page.data) {
        if (typeof page.data.vars === "object") {
          data.vars = page.data.vars;
        }
        delete page.data.vars;
        angular.extend(data, page.data);
      }
      delete page.data;
      angular.extend(data.vars, page);
      return data;
    }

    function buildState(path, state) {
      return {
        templateUrl: path,
        controller: getController(state),
      };
    }

    function getController(state) {
      var ctrl = state.controller || 'DefaultController';

      if (!/\w\s+as\s+\w/.test(ctrl)) {
        ctrl += ' as PageCtrl';
      }

      return ctrl;
    }

    function buildAnimations(state) {
      var animations = {};

      if (state.animationIn) {
        animations.enter = state.animationIn;
      }

      if (state.animationOut) {
        animations.leave = state.animationOut;
      }

      return animations;
    }
  }

  DefaultController.$inject = ['$scope', '$stateParams', '$state'];

  function DefaultController($scope, $stateParams, $state) {
    var params = {};
    angular.forEach($stateParams, function(value, key) {
      params[key] = value;
    });

    $scope.params = params;
    $scope.current = $state.current.name;

    if($state.current.views) {
      $scope.vars = $state.current.data.vars;
      $scope.composed = $state.current.data.vars.children;
    } else {
      $scope.vars = $state.current.data.vars;
    }
  }

  DynamicRoutingConfig.$inject = ['$FoundationStateProvider'];

  function DynamicRoutingConfig(FoundationStateProvider) {
    // Don't error out if Front Router is not being used
    var foundationRoutes = window.foundationRoutes || [];

    FoundationStateProvider.registerDynamicRoutes(foundationRoutes);
  }

  DynamicRoutingRun.$inject = ['$rootScope', '$state', '$stateParams'];

  function DynamicRoutingRun($rootScope, $state, $stateParams) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
  }

})();

(function() {
  'use strict';

  angular.module('foundation.mediaquery', ['foundation.core'])
    .run(mqInitRun)
    .factory('FoundationMQInit', FoundationMQInit)
    .factory('mqHelpers', mqHelpers)
    .service('FoundationMQ', FoundationMQ)
  ;


  angular.module('base.mediaquery', ['base.core'])
    .run(mqInitRun)
    .factory('FoundationMQInit', FoundationMQInit)
    .factory('mqHelpers', mqHelpers)
    .service('FoundationMQ', FoundationMQ)
  ;

  mqInitRun.$inject = ['FoundationMQInit'];

  function mqInitRun(mqInit) {
    mqInit.init();
  }

  FoundationMQInit.$inject = ['mqHelpers', 'FoundationApi', 'Utils', 'FoundationMQ'];

  function FoundationMQInit(helpers, foundationApi, u, foundationMQ){
    var factory = {};
    var namedQueries = {
      'default' : 'only screen',
      landscape : 'only screen and (orientation: landscape)',
      portrait : 'only screen and (orientation: portrait)',
      retina : 'only screen and (-webkit-min-device-pixel-ratio: 2),' +
        'only screen and (min--moz-device-pixel-ratio: 2),' +
        'only screen and (-o-min-device-pixel-ratio: 2/1),' +
        'only screen and (min-device-pixel-ratio: 2),' +
        'only screen and (min-resolution: 192dpi),' +
        'only screen and (min-resolution: 2dppx)'
    };

    factory.init = init;

    return factory;

    function init() {
      var mediaQueries;
      var extractedMedia;
      var mediaQuerySizes;
      var mediaMap;
      var key;

      helpers.headerHelper(['foundation-mq']);
      extractedMedia = helpers.getStyle('.foundation-mq', 'font-family');

      if (!extractedMedia.match(/([\w]+=[\d]+[a-z]*&?)+/)) {
        extractedMedia = 'small=0&medium=40rem&large=75rem&xlarge=90rem&xxlarge=120rem';
      }

      mediaQueries = helpers.parseStyleToObject((extractedMedia));
      mediaQuerySizes = [];

      for(key in mediaQueries) {
        mediaQuerySizes.push({ query: key, size: parseInt(mediaQueries[key].replace('rem', '')) });
        mediaQueries[key] = 'only screen and (min-width: ' + mediaQueries[key].replace('rem', 'em') + ')';
      }

      // sort by increasing size
      mediaQuerySizes.sort(function(a,b) {
        return a.size > b.size ? 1 : (a.size < b.size ? -1 : 0);
      });

      mediaMap = {};
      for (key = 0; key < mediaQuerySizes.length; key++) {
        mediaMap[mediaQuerySizes[key].query] = {
          up: null,
          down: null
        };

        if (key+1 < mediaQuerySizes.length) {
          mediaMap[mediaQuerySizes[key].query].up = mediaQuerySizes[key+1].query;
        }

        if (key !== 0) {
          mediaMap[mediaQuerySizes[key].query].down = mediaQuerySizes[key-1].query;
        }
      }

      foundationApi.modifySettings({
        mediaQueries: angular.extend(mediaQueries, namedQueries),
        mediaMap: mediaMap
      });

      window.addEventListener('resize', u.throttle(function() {
        // any resize event causes a clearing of the media cache
        foundationMQ.clearCache();

        foundationApi.publish('resize', 'window resized');
      }, 50));
    }
  }


  function mqHelpers() {
    var factory = {};

    factory.headerHelper = headerHelper;
    factory.getStyle = getStyle;
    factory.parseStyleToObject = parseStyleToObject;

    return factory;

    function headerHelper(classArray) {
      var i = classArray.length;
      var head = angular.element(document.querySelectorAll('head'));

      while(i--) {
        head.append('<meta class="' + classArray[i] + '" />');
      }

      return;
    }

    function getStyle(selector, styleName) {
      var elem  = document.querySelectorAll(selector)[0];
      var style = window.getComputedStyle(elem, null);

      return style.getPropertyValue('font-family');
    }

      // https://github.com/sindresorhus/query-string
    function parseStyleToObject(str) {
      var styleObject = {};

      if (typeof str !== 'string') {
        return styleObject;
      }

      if ((str[0] === '"' && str[str.length - 1] === '"') || (str[0] === '\'' && str[str.length - 1] === '\'')) {
        str = str.trim().slice(1, -1); // some browsers re-quote string style values
      }

      if (!str) {
        return styleObject;
      }

      styleObject = str.split('&').reduce(function(ret, param) {
        var parts = param.replace(/\+/g, ' ').split('=');
        var key = parts[0];
        var val = parts[1];
        key = decodeURIComponent(key);

        // missing `=` should be `null`:
        // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
        val = val === undefined ? null : decodeURIComponent(val);

        if (!ret.hasOwnProperty(key)) {
          ret[key] = val;
        } else if (Array.isArray(ret[key])) {
          ret[key].push(val);
        } else {
          ret[key] = [ret[key], val];
        }
        return ret;
      }, {});

      return styleObject;
    }
  }

  FoundationMQ.$inject = ['FoundationApi'];

  function FoundationMQ(foundationApi) {
    var service = [],
        mediaQueryResultCache = {},
        queryMinWidthCache = {};

    service.getMediaQueries = getMediaQueries;
    service.match = match;
    service.matchesMedia = matchesMedia;
    service.matchesMediaOrSmaller = matchesMediaOrSmaller;
    service.matchesMediaOnly = matchesMediaOnly;
    service.collectScenariosFromElement = collectScenariosFromElement;
    service.clearCache = clearCache;

    return service;

    // METHOD INTENDED FOR INTERNAL USE ONLY
    function clearCache() {
      mediaQueryResultCache = {};
    }

    function getMediaQueries() {
      return foundationApi.getSettings().mediaQueries;
    }

    function getNextLargestMediaQuery(media) {
      var mediaMapEntry = foundationApi.getSettings().mediaMap[media];
      if (mediaMapEntry) {
        return mediaMapEntry.up;
      } else {
        return null;
      }
    }

    function getNextSmallestMediaQuery(media) {
      var mediaMapEntry = foundationApi.getSettings().mediaMap[media];
      if (mediaMapEntry) {
        return mediaMapEntry.down;
      } else {
        return null;
      }
    }

    function match(scenarios) {
      var count   = scenarios.length;
      var queries = service.getMediaQueries();
      var matches = [];

      if (count > 0) {
        while (count--) {
          var mq;
          var rule = scenarios[count].media;

          if (queries[rule]) {
            mq = matchMedia(queries[rule]);
          } else {
            mq = matchMedia(rule);
          }

          if (mq.matches) {
            matches.push({ ind: count});
          }
        }
      }

      return matches;
    }

    function matchesMedia(query) {
      if (angular.isUndefined(mediaQueryResultCache[query])) {
        // cache miss, run media query
        mediaQueryResultCache[query] = match([{media: query}]).length > 0;
      }
      return mediaQueryResultCache[query];
    }

    function matchesMediaOrSmaller(query) {
      // In order to match the named breakpoint or smaller,
      // the next largest named breakpoint cannot be matched
      var nextLargestMedia = getNextLargestMediaQuery(query);
      if (nextLargestMedia && matchesMedia(nextLargestMedia)) {
        return false;
      }

      // Check to see if any smaller named breakpoint is matched
      return matchesSmallerRecursive(query);

      function matchesSmallerRecursive(query) {
        var nextSmallestMedia;

        if (matchesMedia(query)) {
          // matches breakpoint
          return true;
        } else {
          // check if matches smaller media
          nextSmallestMedia = getNextSmallestMediaQuery(query);
          if (!nextSmallestMedia) {
            // no more smaller breakpoints
            return false;
          } else {
            return matchesSmallerRecursive(nextSmallestMedia);
          }
        }
      }
    }

    function matchesMediaOnly(query) {
      // Check that media ONLY matches named breakpoint and nothing else
      var nextLargestMedia = getNextLargestMediaQuery(query);

      if (!nextLargestMedia) {
        // reached max media size, run query for current media
        return matchesMedia(query);
      } else {
        // must match named breakpoint, but not next largest
        return matchesMedia(query) && !matchesMedia(nextLargestMedia);
      }
    }

    // Collects a scenario object and templates from element
    function collectScenariosFromElement(parentElement) {
      var scenarios = [];
      var templates = [];

      var elements = parentElement.children();
      var i        = 0;

      angular.forEach(elements, function(el) {
        var elem = angular.element(el);

        //if no source or no html, capture element itself
        if (!elem.attr('src') || !elem.attr('src').match(/.html$/)) {
          templates[i] = elem;
          scenarios[i] = { media: elem.attr('media'), templ: i };
        } else {
          scenarios[i] = { media: elem.attr('media'), src: elem.attr('src') };
        }

        i++;
      });

      return {
        scenarios: scenarios,
        templates: templates
      };
    }
  }
})();

angular.module('markdown', [])
  .directive('markdown', function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs, controller) {
        element.html(marked(element.html()));
      }
    };

});

'use strict';

(function(){
  var svgDirectives = {};

  angular.forEach([
      'clipPath',
      'colorProfile',
      'src',
      'cursor',
      'fill',
      'filter',
      'marker',
      'markerStart',
      'markerMid',
      'markerEnd',
      'mask',
      'stroke'
    ],
    function(attr) {
      svgDirectives[attr] = [
          '$rootScope',
          '$location',
          '$interpolate',
          '$sniffer',
          'urlResolve',
          'computeSVGAttrValue',
          'svgAttrExpressions',
          function(
              $rootScope,
              $location,
              $interpolate,
              $sniffer,
              urlResolve,
              computeSVGAttrValue,
              svgAttrExpressions) {
            return {
              restrict: 'A',
              link: function(scope, element, attrs) {
                var initialUrl;

                //Only apply to svg elements to avoid unnecessary observing
                //Check that is in html5Mode and that history is supported
                if ((!svgAttrExpressions.SVG_ELEMENT.test(element[0] &&
                    element[0].toString())) ||
                  !$location.$$html5 ||
                  !$sniffer.history) return;

                //Assumes no expressions, since svg is unforgiving of xml violations
                initialUrl = attrs[attr];
                attrs.$observe(attr, updateValue);
                $rootScope.$on('$locationChangeSuccess', updateValue);

                function updateValue () {
                  var newVal = computeSVGAttrValue(initialUrl);
                  //Prevent recursive updating
                  if (newVal && attrs[attr] !== newVal) attrs.$set(attr, newVal);
                }
              }
            };
          }];
  });

  angular.module('ngSVGAttributes', []).
    factory('urlResolve', [function() {
      //Duplicate of urlResolve & urlParsingNode in angular core
      var urlParsingNode = document.createElement('a');
      return function urlResolve(url) {
        urlParsingNode.setAttribute('href', url);
        return urlParsingNode;
      };
    }]).
    value('svgAttrExpressions', {
      FUNC_URI: /^url\((.*)\)$/,
      SVG_ELEMENT: /SVG[a-zA-Z]*Element/,
      HASH_PART: /#.*/
    }).
    factory('computeSVGAttrValue', [
                '$location', '$sniffer', 'svgAttrExpressions', 'urlResolve',
        function($location,   $sniffer,   svgAttrExpressions,   urlResolve) {
          return function computeSVGAttrValue(url) {
            var match, fullUrl;
            if (match = svgAttrExpressions.FUNC_URI.exec(url)) {
              //hash in html5Mode, forces to be relative to current url instead of base
              if (match[1].indexOf('#') === 0) {
                fullUrl = $location.absUrl().
                  replace(svgAttrExpressions.HASH_PART, '') +
                  match[1];
              }
              //Presumably links to external SVG document
              else {
                fullUrl = urlResolve(match[1]);
              }
            }
            return fullUrl ? 'url(' + fullUrl + ')' : null;
          };
        }
      ]
    ).
    directive(svgDirectives);
}());

(function() {
  'use strict';

  angular.module('foundation.accordion', [])
    .controller('ZfAccordionController', zfAccordionController)
    .directive('zfAccordion', zfAccordion)
    .directive('zfAccordionItem', zfAccordionItem)
  ;


  angular.module('base.accordion', [])
    .controller('ZfAccordionController', zfAccordionController)
    .directive('zfAccordion', zfAccordion)
    .directive('zfAccordionItem', zfAccordionItem)
  ;

  zfAccordionController.$inject = ['$scope'];

  function zfAccordionController($scope) {
    var controller = this;
    var sections = controller.sections = $scope.sections = [];
    var multiOpen   = false;
    var collapsible = false;
    var autoOpen    = true;

    controller.select = function(selectSection) {
      sections.forEach(function(section) {
        if(section.scope === selectSection) {
          if (multiOpen || collapsible) {
            section.scope.active = !section.scope.active;
          } else {
            section.scope.active = true;
          }
        } else {
          if (!multiOpen) {
            section.scope.active = false;
          }
        }
      });
    };

    controller.addSection = function addsection(sectionScope) {
      sections.push({ scope: sectionScope });

      if(sections.length === 1 && autoOpen === true) {
        sections[0].active = true;
        sections[0].scope.active = true;
      }
    };

    controller.closeAll = function() {
      sections.forEach(function(section) {
        section.scope.active = false;
      });
    };

    controller.setAutoOpen = function(val) {
      autoOpen = val;
    };

    controller.setCollapsible = function(val) {
      collapsible = val;
    };

    controller.setMultiOpen = function(val) {
      multiOpen = val;
    };
  }

  function zfAccordion() {
    var directive = {
      restrict: 'EA',
      transclude: 'true',
      replace: true,
      templateUrl: 'components/accordion/accordion.html',
      controller: 'ZfAccordionController',
      scope: {
      },
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller) {
      controller.setAutoOpen(attrs.autoOpen !== "false");
      controller.setCollapsible(attrs.collapsible === "true");
      controller.setMultiOpen(attrs.multiOpen === "true");
    }
  }

  //accordion item
  zfAccordionItem.$inject = ['FoundationApi'];

  function zfAccordionItem(foundationApi) {
    var directive = {
        restrict: 'EA',
        templateUrl: 'components/accordion/accordion-item.html',
        transclude: true,
        scope: {
          title: '@'
        },
        require: '^zfAccordion',
        replace: true,
        controller: function() {},
        link: link
    };

    return directive;

    function link(scope, element, attrs, controller, transclude) {
      scope.id = attrs.id || foundationApi.generateUuid();
      scope.active = false;
      controller.addSection(scope);

      foundationApi.subscribe(scope.id, function(msg) {
        if(msg === 'show' || msg === 'open' || msg === 'activate') {
          if (!scope.active) {
            controller.select(scope);
          }
        }

        if(msg === 'hide' || msg === 'close' || msg === 'deactivate') {
          if (scope.active) {
            controller.select(scope);
          }
        }

        if(msg === 'toggle') {
          controller.select(scope);
        }

        scope.$digest();
      });

      scope.activate = function() {
        controller.select(scope);
      };

      scope.$on("$destroy", function() {
        foundationApi.unsubscribe(scope.id);
      });
    }
  }

})();

(function() {
  'use strict';

  angular.module('foundation.actionsheet', ['foundation.core'])
    .controller('ZfActionSheetController', zfActionSheetController)
    .directive('zfActionSheet', zfActionSheet)
    .directive('zfAsContent', zfAsContent)
    .directive('zfAsButton', zfAsButton)
    .service('FoundationActionSheet', FoundationActionSheet)
  ;

  angular.module('base.actionsheet', ['base.core'])
    .controller('ZfActionSheetController', zfActionSheetController)
    .directive('zfActionSheet', zfActionSheet)
    .directive('zfAsContent', zfAsContent)
    .directive('zfAsButton', zfAsButton)
    .service('FoundationActionSheet', FoundationActionSheet)
  ;

  FoundationActionSheet.$inject = ['FoundationApi'];

  function FoundationActionSheet(foundationApi) {
    var service    = {};

    service.activate = activate;
    service.deactivate = deactivate;

    return service;

    //target should be element ID
    function activate(target) {
      foundationApi.publish(target, 'show');
    }

    //target should be element ID
    function deactivate(target) {
      foundationApi.publish(target, 'hide');
    }
  }

  zfActionSheetController.$inject = ['$scope', 'FoundationApi'];

  function zfActionSheetController($scope, foundationApi) {
    var controller = this;
    var content = controller.content = $scope.content;
    var container = controller.container = $scope.container;
    var body = angular.element(document.body);

    controller.registerContent = function(scope) {
      content = scope;
      content.active = false;
    };

    controller.registerContainer = function(scope) {
      container = scope;
      container.active = false;
    };

    controller.toggle = toggle;
    controller.hide = hide;
    controller.show = show;

    controller.registerListener = function() {
      document.body.addEventListener('click', listenerLogic);
    };

    controller.deregisterListener = function() {
      document.body.removeEventListener('click', listenerLogic);
    }

    function listenerLogic(e) {
      var el = e.target;
      var insideActionSheet = false;

      do {
        if(el.classList && el.classList.contains('action-sheet-container')) {
          insideActionSheet = true;
          break;
        }

      } while ((el = el.parentNode));

      if(!insideActionSheet) {
        // if the element has a toggle attribute, do nothing
        if (e.target.attributes['zf-toggle'] || e.target.attributes['zf-hard-toggle']) {
          return;
        };
        // if the element is outside the action sheet and is NOT a toggle element, hide
        hide();
      }
    }

    function hide() {
      content.hide();
      container.hide();

      if (!$scope.$$phase) {
        content.$apply();
        container.$apply();
      }
    }

    function toggle() {
      content.toggle();
      container.toggle();

      if (!$scope.$$phase) {
        content.$apply();
        container.$apply();
      }
    }

    function show() {
      content.show();
      container.show();

      if (!$scope.$$phase) {
        content.$apply();
        container.$apply();
      }
    }
  }

  zfActionSheet.$inject = ['FoundationApi'];

  function zfActionSheet(foundationApi) {
    var directive = {
      restrict: 'EA',
      transclude: true,
      replace: true,
      templateUrl: 'components/actionsheet/actionsheet.html',
      controller: 'ZfActionSheetController',
      compile: compile
    };

    return directive;

    function compile() {

      return {
        pre: preLink,
        post: postLink
      };

      function preLink(scope, iElement, iAttrs) {
        iAttrs.$set('zf-closable', 'actionsheet');
      }

      function postLink(scope, element, attrs, controller) {
        var id = attrs.id || foundationApi.generateUuid();
        attrs.$set('id', id);

        scope.active = false;

        foundationApi.subscribe(id, function(msg) {
          if (msg === 'toggle') {
            controller.toggle();
          }

          if (msg === 'hide' || msg === 'close') {
            controller.hide();
          }

          if (msg === 'show' || msg === 'open') {
            controller.show();
          }
        });

        controller.registerContainer(scope);

        scope.toggle = function() {
          scope.active = !scope.active;
          return;
        };

        scope.hide = function() {
          scope.active = false;
          return;
        };

        scope.show = function() {
          scope.active = true;
          return;
        };

        scope.$on("$destroy", function() {
          foundationApi.unsubscribe(id);
        });
      }
    }
  }

  zfAsContent.$inject = ['FoundationApi'];

  function zfAsContent(foundationApi) {
    var directive = {
      restrict: 'EA',
      transclude: true,
      replace: true,
      templateUrl: 'components/actionsheet/actionsheet-content.html',
      require: '^zfActionSheet',
      scope: {
        position: '@?'
      },
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller) {
      scope.active = false;
      scope.position = scope.position || 'bottom';
      controller.registerContent(scope);

      scope.toggle = function() {
        scope.active = !scope.active;
        if(scope.active) {
          controller.registerListener();
        } else {
          controller.deregisterListener();
        }

        return;
      };

      scope.hide = function() {
        scope.active = false;
        controller.deregisterListener();
        return;
      };

      scope.show = function() {
        scope.active = true;
        controller.registerListener();
        return;
      };
    }
  }

  zfAsButton.$inject = ['FoundationApi'];

  function zfAsButton(foundationApi) {
    var directive = {
      restrict: 'EA',
      transclude: true,
      replace: true,
      templateUrl: 'components/actionsheet/actionsheet-button.html',
      require: '^zfActionSheet',
      scope: {
        title: '@?'
      },
      link: link
    }

    return directive;

    function link(scope, element, attrs, controller) {

      element.on('click', function(e) {
        controller.toggle();
        e.preventDefault();
      });

    }
  }

})();

(function() {
  'use strict';

  angular.module('foundation.common', ['foundation.core'])
    .directive('zfClose', zfClose)
    .directive('zfOpen', zfOpen)
    .directive('zfToggle', zfToggle)
    .directive('zfEscClose', zfEscClose)
    .directive('zfSwipeClose', zfSwipeClose)
    .directive('zfHardToggle', zfHardToggle)
    .directive('zfCloseAll', zfCloseAll)
  ;

  angular.module('base.common', ['base.core'])
    .directive('zfClose', zfClose)
    .directive('zfOpen', zfOpen)
    .directive('zfToggle', zfToggle)
    .directive('zfEscClose', zfEscClose)
    .directive('zfSwipeClose', zfSwipeClose)
    .directive('zfHardToggle', zfHardToggle)
    .directive('zfCloseAll', zfCloseAll)
  ;

  zfClose.$inject = ['FoundationApi'];

  function zfClose(foundationApi) {
    var directive = {
      restrict: 'A',
      link: link
    };

    return directive;

    function link(scope, element, attrs) {
      var targetId = '';
      if (attrs.zfClose) {
        targetId = attrs.zfClose;
      } else {
        var parentElement= false;
        var tempElement = element.parent();
        //find parent modal
        while(parentElement === false) {
          if(tempElement[0].nodeName == 'BODY') {
            parentElement = '';
          }

          if(typeof tempElement.attr('zf-closable') !== 'undefined' && tempElement.attr('zf-closable') !== false) {
            parentElement = tempElement;
          }

          tempElement = tempElement.parent();
        }
        targetId = parentElement.attr('id');
      }
      element.on('click', function(e) {
        foundationApi.publish(targetId, 'close');
        e.preventDefault();
      });
    }
  }

  zfOpen.$inject = ['FoundationApi'];

  function zfOpen(foundationApi) {
    var directive = {
      restrict: 'A',
      link: link
    };

    return directive;

    function link(scope, element, attrs) {
      element.on('click', function(e) {
        foundationApi.publish(attrs.zfOpen, 'open');
        e.preventDefault();
      });
    }
  }

  zfToggle.$inject = ['FoundationApi'];

  function zfToggle(foundationApi) {
    var directive = {
      restrict: 'A',
      link: link
    }

    return directive;

    function link(scope, element, attrs) {
      element.on('click', function(e) {
        foundationApi.publish(attrs.zfToggle, 'toggle');
        e.preventDefault();
      });
    }
  }

  zfEscClose.$inject = ['FoundationApi'];

  function zfEscClose(foundationApi) {
    var directive = {
      restrict: 'A',
      link: link
    };

    return directive;

    function link(scope, element, attrs) {
      element.on('keyup', function(e) {
        if (e.keyCode === 27) {
          foundationApi.closeActiveElements();
        }
        e.preventDefault();
      });
    }
  }

  zfSwipeClose.$inject = ['FoundationApi'];

  function zfSwipeClose(foundationApi) {
    var directive = {
      restrict: 'A',
      link: link
    };
    return directive;

    function link($scope, element, attrs) {
      var swipeDirection;
      var hammerElem;
      if (typeof(Hammer)!=='undefined') {
        hammerElem = new Hammer(element[0]);
        // set the options for swipe (to make them a bit more forgiving in detection)
        hammerElem.get('swipe').set({
          direction: Hammer.DIRECTION_ALL,
          threshold: 5, // this is how far the swipe has to travel
          velocity: 0.5 // and this is how fast the swipe must travel
        });
      }
      // detect what direction the directive is pointing
      switch (attrs.zfSwipeClose) {
        case 'right':
          swipeDirection = 'swiperight';
          break;
        case 'left':
          swipeDirection = 'swipeleft';
          break;
        case 'up':
          swipeDirection = 'swipeup';
          break;
        case 'down':
          swipeDirection = 'swipedown';
          break;
        default:
          swipeDirection = 'swipe';
      }
      if(typeof(hammerElem) !== 'undefined'){
        hammerElem.on(swipeDirection, function() {
          foundationApi.publish(attrs.id, 'close');
        });
      }
    }
  }

  zfHardToggle.$inject = ['FoundationApi'];

  function zfHardToggle(foundationApi) {
    var directive = {
      restrict: 'A',
      link: link
    };

    return directive;

    function link(scope, element, attrs) {
      element.on('click', function(e) {
        foundationApi.closeActiveElements({exclude: attrs.zfHardToggle});
        foundationApi.publish(attrs.zfHardToggle, 'toggle');
        e.preventDefault();
      });
    }
  }

  zfCloseAll.$inject = ['FoundationApi'];

  function zfCloseAll(foundationApi) {
    var directive = {
      restrict: 'A',
      link: link
    };

    return directive;

    function link(scope, element, attrs) {
      element.on('click', function(e) {
        var tar = e.target, avoid, activeElements, closedElements, i;

        // check if clicked target is designated to open/close another component
        avoid = ['zf-toggle', 'zf-hard-toggle', 'zf-open', 'zf-close'].filter(function(e){
          return e in tar.attributes;
        });
        if(avoid.length > 0) {
          // do nothing
          return;
        }

        // check if clicked element is inside active closable parent
        if (getParentsUntil(tar, 'zf-closable') !== false) {
          // do nothing
          return;
        }

        // close all active elements
        activeElements = document.querySelectorAll('.is-active[zf-closable]');
        closedElements = 0;
        if(activeElements.length > 0) {
          for(i = 0; i < activeElements.length; i++) {
            if (!activeElements[i].hasAttribute('zf-ignore-all-close')) {
              foundationApi.publish(activeElements[i].id, 'close');
              closedElements++;
            }
          }

          // if one or more elements were closed,
          // prevent the default action
          if (closedElements > 0) {
            e.preventDefault();
          }
        }
      });
    }
    /** special thanks to Chris Ferdinandi for this solution.
     * http://gomakethings.com/climbing-up-and-down-the-dom-tree-with-vanilla-javascript/
     */
    function getParentsUntil(elem, parent) {
      for ( ; elem && elem !== document.body; elem = elem.parentNode ) {
        if(elem.hasAttribute(parent)){
          if(elem.classList.contains('is-active')){ return elem; }
          break;
        }
      }
      return false;
    }
  }
})();

(function () {
  'use strict';

  angular.module('foundation.iconic', [])
    .provider('Iconic', Iconic)
    .directive('zfIconic', zfIconic)
  ;

  angular.module('base.iconic', [])
    .provider('Iconic', Iconic)
    .directive('zfIconic', zfIconic)
  ;

  // iconic wrapper
  function Iconic() {
    // default path
    var assetPath = 'assets/img/iconic/';

    /**
     * Sets the path used to locate the iconic SVG files
     * @param {string} path - the base path used to locate the iconic SVG files
     */
    this.setAssetPath = function (path) {
      assetPath = angular.isString(path) ? path : assetPath;
    };

    /**
     * Service implementation
     * @returns {{}}
     */
    this.$get = function () {
      var iconicObject = new IconicJS();

      var service = {
        getAccess: getAccess,
        getAssetPath: getAssetPath
      };

      return service;

      /**
       *
       * @returns {Window.IconicJS}
       */
      function getAccess() {
        return iconicObject;
      }

      /**
       *
       * @returns {string}
       */
      function getAssetPath() {
        return assetPath;
      }
    };
  }

  zfIconic.$inject = ['Iconic', 'FoundationApi', '$compile'];

  function zfIconic(iconic, foundationApi, $compile) {
    var directive = {
      restrict: 'A',
      template: '<img ng-transclude>',
      transclude: true,
      replace: true,
      scope: {
        dynSrc: '=?',
        dynIcon: '=?',
        dynIconAttrs: '=?',
        size: '@?',
        icon: '@',
        iconDir: '@?',
        iconAttrs: '=?'
      },
      compile: compile
    };

    return directive;

    function compile() {
      var contents, origAttrs, lastIconAttrs, assetPath;

      return {
        pre: preLink,
        post: postLink
      };

      function preLink(scope, element, attrs) {
        var iconAttrsObj, iconAttr;

        if (scope.iconDir) {
          // path set via attribute
          assetPath = scope.iconDir;
        } else {
          // default path
          assetPath = iconic.getAssetPath();
        }
        // make sure ends with /
        if (assetPath.charAt(assetPath.length - 1) !== '/') {
          assetPath += '/';
        }

        if (scope.dynSrc) {
          attrs.$set('data-src', scope.dynSrc);
        } else if (scope.dynIcon) {
          attrs.$set('data-src', assetPath + scope.dynIcon + '.svg');
        } else {
          if (scope.icon) {
            attrs.$set('data-src', assetPath + scope.icon + '.svg');
          } else {
            // To support expressions on data-src
            attrs.$set('data-src', attrs.src);
          }
        }

        // check if size already added as class
        if (!element.hasClass('iconic-sm') && !element.hasClass('iconic-md') && !element.hasClass('iconic-lg')) {
          var iconicClass;
          switch (scope.size) {
            case 'small':
              iconicClass = 'iconic-sm';
              break;
            case 'medium':
              iconicClass = 'iconic-md';
              break;
            case 'large':
              iconicClass = 'iconic-lg';
              break;
            default:
              iconicClass = 'iconic-fluid';
          }
          element.addClass(iconicClass);
        }

        // add static icon attributes to iconic element
        if (scope.iconAttrs) {
          iconAttrsObj = angular.fromJson(scope.iconAttrs);
          for (iconAttr in iconAttrsObj) {
            // add data- to attribute name if not already present
            attrs.$set(addDataDash(iconAttr), iconAttrsObj[iconAttr]);
          }
        }

        // save contents and attributes of un-inject html, to use for dynamic re-injection
        contents = element[0].outerHTML;
        origAttrs = element[0].attributes;
      }

      function postLink(scope, element, attrs) {
        var svgElement, ico = iconic.getAccess();

        injectSvg(element[0]);

        // subscribe for resize events
        foundationApi.subscribe('resize', resize);

        scope.$on("$destroy", function() {
          foundationApi.unsubscribe('resize', resize);
        });

        // handle dynamic updating of src
        if (scope.dynSrc) {
          scope.$watch('dynSrc', function (newVal, oldVal) {
            if (newVal && newVal !== oldVal) {
              reinjectSvg(scope.dynSrc, scope.dynIconAttrs);
            }
          });
        }
        // handle dynamic updating of icon
        if (scope.dynIcon) {
          scope.$watch('dynIcon', function (newVal, oldVal) {
            if (newVal && newVal !== oldVal) {
              reinjectSvg(assetPath + scope.dynIcon + '.svg', scope.dynIconAttrs);
            }
          });
        }
        // handle dynamic updating of icon attrs
        scope.$watch('dynIconAttrs', function (newVal, oldVal) {
          if (newVal && newVal !== oldVal) {
            if (scope.dynSrc) {
              reinjectSvg(scope.dynSrc, scope.dynIconAttrs);
            } else {
              reinjectSvg(assetPath + scope.dynIcon + '.svg', scope.dynIconAttrs);
            }
          }
        });

        function reinjectSvg(newSrc, newAttrs) {
          var iconAttr;

          if (svgElement) {
            // set html
            svgElement.empty();
            svgElement.append(angular.element(contents));

            // remove 'data-icon' attribute added by injector as it
            // will cause issues with reinjection when changing icons
            svgElement.removeAttr('data-icon');

            // set new source
            svgElement.attr('data-src', newSrc);

            // add additional icon attributes to iconic element
            if (newAttrs) {
              // remove previously added attributes
              if (lastIconAttrs) {
                for (iconAttr in lastIconAttrs) {
                  svgElement.removeAttr(addDataDash(iconAttr));
                }
              }

              // add newly added attributes
              for (iconAttr in newAttrs) {
                // add data- to attribute name if not already present
                svgElement.attr(addDataDash(iconAttr), newAttrs[iconAttr]);
              }
            }

            // store current attrs
            lastIconAttrs = newAttrs;

            // reinject
            injectSvg(svgElement[0]);
          }
        }

        function injectSvg(element) {
          ico.inject(element, {
            each: function (injectedElem) {

              var i, angElem, elemScope;

              // wrap raw element
              angElem = angular.element(injectedElem);

              for(i = 0; i < origAttrs.length; i++) {
                // check if attribute should be ignored
                if (origAttrs[i].name !== 'zf-iconic' &&
                  origAttrs[i].name !== 'ng-transclude' &&
                  origAttrs[i].name !== 'icon' &&
                  origAttrs[i].name !== 'src') {
                  // check if attribute already exists on svg
                  if (angular.isUndefined(angElem.attr(origAttrs[i].name))) {
                    // add attribute to svg
                    angElem.attr(origAttrs[i].name, origAttrs[i].value);
                  }
                }
              }

              // compile
              elemScope = angElem.scope();
              if (elemScope) {
                svgElement = $compile(angElem)(elemScope);
              }
            }
          });
        }

        function resize() {
          // run update on current element
          ico.update(element[0]);
        }
      }

      function addDataDash(attr) {
        return attr.indexOf('data-') !== 0 ? 'data-' + attr : attr;
      }
    }
  }

})();

(function() {
  'use strict';

  angular.module('foundation.interchange', ['foundation.core', 'foundation.mediaquery'])
    .directive('zfInterchange', zfInterchange)
  ;

  angular.module('base.interchange', ['base.core', 'base.mediaquery'])
    .directive('zfInterchange', zfInterchange)
  ;

  zfInterchange.$inject = [ '$compile', '$http', '$templateCache', 'FoundationApi', 'FoundationMQ'];

  function zfInterchange($compile, $http, $templateCache, foundationApi, foundationMQ) {

    var directive = {
      restrict: 'EA',
      transclude: 'element',
      scope: {
        position: '@'
      },
      replace: true,
      template: '<div></div>',
      link: link
    };

    return directive;

    function link(scope, element, attrs, ctrl, transclude) {
      var childScope, current, scenarios, innerTemplates;

      var globalQueries = foundationMQ.getMediaQueries();

      // subscribe for resize events
      foundationApi.subscribe('resize', resize);

      scope.$on("$destroy", function() {
        foundationApi.unsubscribe('resize', resize);
      });

      //init
      foundationApi.publish('resize', 'initial resize');

      function templateLoader(templateUrl) {
        return $http.get(templateUrl, {cache: $templateCache});
      }

      function collectInformation(el) {
        var data = foundationMQ.collectScenariosFromElement(el);

        scenarios = data.scenarios;
        innerTemplates = data.templates;
      }

      function checkScenario(scenario) {
        return !current || current !== scenario;
      }

      function resize(msg) {
        transclude(function(clone, newScope) {
          if(!scenarios || !innerTemplates) {
            collectInformation(clone);
          }

          var ruleMatches = foundationMQ.match(scenarios);
          var scenario = ruleMatches.length === 0 ? null : scenarios[ruleMatches[0].ind];

          //this could use some love
          if(scenario && checkScenario(scenario)) {
            var compiled;

            if(childScope) {
              childScope.$destroy();
              childScope = null;
            }

            if(typeof scenario.templ !== 'undefined') {
              childScope = newScope;

              //temp container
              var tmp = document.createElement('div');
              tmp.appendChild(innerTemplates[scenario.templ][0]);

              element.html(tmp.innerHTML);
              $compile(element.contents())(childScope);
              current = scenario;
            } else {
              var loader = templateLoader(scenario.src);
              loader.success(function(html) {
                childScope = newScope;
                element.html(html);
              }).then(function(){
                $compile(element.contents())(childScope);
                current = scenario;
              });
            }
          }
        });
      }
    }
  }

  angular.module('foundation.interchange')
  /*
   * Final directive to perform media queries, other directives set up this one
   * (See: http://stackoverflow.com/questions/19224028/add-directives-from-directive-in-angularjs)
   */
    .directive('zfQuery', zfQuery)
  /*
   * zf-if / zf-show / zf-hide
   */
    .directive('zfIf', zfQueryDirective('ng-if', 'zf-if'))
    .directive('zfShow', zfQueryDirective('ng-show', 'zf-show'))
    .directive('zfHide', zfQueryDirective('ng-hide', 'zf-hide'))
  ;

  /*
   * This directive will configure ng-if/ng-show/ng-hide and zf-query directives and then recompile the element
   */
  function zfQueryDirective(angularDirective, directiveName) {
    return ['$compile', 'FoundationApi', function ($compile, foundationApi) {
      // create unique scope property for media query result, must be unique to avoid collision with other zf-query directives
      // property set upon element compilation or else all similar directives (i.e. zf-if-*/zf-show-*/zf-hide-*) will get the same value
      var queryResult;

      return {
        priority: 1000, // must compile directive before any others
        terminal: true, // don't compile any other directive after this
                        // we'll fix this with a recompile
        restrict: 'A',
        compile: compile
      };

      // From here onward, scope[queryResult] refers to the result of running the provided query
      function compile(element, attrs) {
        var previousParam;

        // set unique property
        queryResult = (directiveName + foundationApi.generateUuid()).replace(/-/g,'');

        // set default configuration
        element.attr('zf-query-not', false);
        element.attr('zf-query-only', false);
        element.attr('zf-query-or-smaller', false);
        element.attr('zf-query-scope-prop', queryResult);

        // parse directive attribute for query parameters
        element.attr(directiveName).split(' ').forEach(function(param) {
          if (param) {
            // add zf-query directive and configuration attributes
            switch (param) {
              case "not":
                element.attr('zf-query-not', true);
                element.attr('zf-query-only', true);
                break;
              case "only":
                element.attr('zf-query-only', true);
                break;
              case "or":
                break;
              case "smaller":
                // allow usage of smaller keyword if preceeded by 'or' keyword
                if (previousParam === "or") {
                  element.attr('zf-query-or-smaller', true);
                }
                break;
              default:
                element.attr('zf-query', param);
                break;
            }

            previousParam = param;
          }
        });

        // add/update angular directive
        if (!element.attr(angularDirective)) {
          element.attr(angularDirective, queryResult);
        } else {
          element.attr(angularDirective, queryResult + ' && (' + element.attr(angularDirective) + ')');
        }

        // remove directive from current element to avoid infinite recompile
        element.removeAttr(directiveName);
        element.removeAttr('data-' + directiveName);

        return {
          pre: function (scope, element, attrs) {
          },
          post: function (scope, element, attrs) {
            // recompile
            $compile(element)(scope);
          }
        };
      }
    }];
  }

  zfQuery.$inject = ['FoundationApi', 'FoundationMQ'];
  function zfQuery(foundationApi, foundationMQ) {
    return {
      priority: 601, // must compile before ng-if (600)
      restrict: 'A',
      compile: function compile(element, attrs) {
        return compileWrapper(attrs['zfQueryScopeProp'],
                              attrs['zfQuery'],
                              attrs['zfQueryOnly'] === "true",
                              attrs['zfQueryNot'] === "true",
                              attrs['zfQueryOrSmaller'] === "true");
      }
    };

    // parameters will be populated with values provided from zf-query-* attributes
    function compileWrapper(queryResult, namedQuery, queryOnly, queryNot, queryOrSmaller) {
      // set defaults
      queryOnly = queryOnly || false;
      queryNot = queryNot || false;

      return {
        pre: preLink,
        post: postLink
      };

      // From here onward, scope[queryResult] refers to the result of running the provided query
      function preLink(scope, element, attrs) {
        // initially set media query result to false
        scope[queryResult] = false;
      }

      function postLink(scope, element, attrs) {
        // subscribe for resize events
        foundationApi.subscribe('resize', resize);

        scope.$on("$destroy", function() {
          foundationApi.unsubscribe('resize', resize);
        });

        // run first media query check
        runQuery();

        function runQuery() {
          if (!queryOnly) {
            if (!queryOrSmaller) {
              // Check if matches media or LARGER
              scope[queryResult] = foundationMQ.matchesMedia(namedQuery);
            } else {
              // Check if matches media or SMALLER
              scope[queryResult] = foundationMQ.matchesMediaOrSmaller(namedQuery);
            }
          } else {
            if (!queryNot) {
              // Check that media ONLY matches named query and nothing else
              scope[queryResult] = foundationMQ.matchesMediaOnly(namedQuery);
            } else {
              // Check that media does NOT match named query
              scope[queryResult] = !foundationMQ.matchesMediaOnly(namedQuery);
            }
          }
        }

        function resize() {
          var orignalVisibilty = scope[queryResult];
          runQuery();
          if (orignalVisibilty != scope[queryResult]) {
            // digest if visibility changed
            scope.$digest();
          }
        }
      }
    }
  }
})();

(function() {
  'use strict';

  angular.module('foundation.modal', ['foundation.core'])
    .directive('zfModal', modalDirective)
    .factory('ModalFactory', ModalFactory)
    .service('FoundationModal', FoundationModal)
  ;

  angular.module('base.modal', ['base.core'])
    .directive('zfModal', modalDirective)
    .factory('ModalFactory', ModalFactory)
    .factory('ConfirmModal', ConfirmModal)
    .factory('PromptModal', PromptModal)
    .service('FoundationModal', FoundationModal)
  ;

  FoundationModal.$inject = ['FoundationApi', 'ModalFactory'];

  function FoundationModal(foundationApi, ModalFactory) {
    var service    = {};

    service.activate = activate;
    service.deactivate = deactivate;
    service.newModal = newModal;

    return service;

    //target should be element ID
    function activate(target) {
      foundationApi.publish(target, 'show');
    }

    //target should be element ID
    function deactivate(target) {
      foundationApi.publish(target, 'hide');
    }

    //new modal has to be controlled via the new instance
    function newModal(config) {
      return new ModalFactory(config);
    }
  }

  modalDirective.$inject = ['FoundationApi'];

  function modalDirective(foundationApi) {

    var directive = {
      restrict: 'EA',
      templateUrl: 'components/modal/modal.html',
      transclude: true,
      scope: true,
      replace: true,
      compile: compile
    };

    return directive;

    function compile(tElement, tAttrs, transclude) {
      var type = 'modal';

      return {
        pre: preLink,
        post: postLink
      };

      function preLink(scope, iElement, iAttrs, controller) {
          iAttrs.$set('zf-closable', type);
      }

      function postLink(scope, element, attrs) {
        var dialog = angular.element(element.children()[0]);
        var animateFn = attrs.hasOwnProperty('zfAdvise') ? foundationApi.animateAndAdvise : foundationApi.animate;

        scope.active = false;
        scope.overlay = attrs.overlay === 'false' ? false : true;
        scope.overlayClose = attrs.overlayClose === 'false' ? false : true;

        var animationIn = attrs.animationIn || 'fadeIn';
        var animationOut = attrs.animationOut || 'fadeOut';

        var overlayIn = 'fadeIn';
        var overlayOut = 'fadeOut';

        scope.hideOverlay = function($event) {
          if($event.target.id == attrs.id && scope.overlayClose) {
            foundationApi.publish(attrs.id, 'close');
          }
        };

        scope.hide = function() {
          if (scope.active) {
            scope.active = false;
            adviseActiveChanged();
            animate();
          }
          return;
        };

        scope.show = function() {
          if (!scope.active) {
            scope.active = true;
            adviseActiveChanged();
            animate();
            dialog.tabIndex = -1;
            dialog[0].focus();
          }
          return;
        };

        scope.toggle = function() {
          scope.active = !scope.active;
          adviseActiveChanged();
          animate();
          return;
        };

        scope.$on("$destroy", function() {
          foundationApi.unsubscribe(attrs.id);
        });

        //setup
        foundationApi.subscribe(attrs.id, function(msg) {
          if(msg === 'show' || msg === 'open') {
            scope.show();
          } else if (msg === 'close' || msg === 'hide') {
            scope.hide();
          } else if (msg === 'toggle') {
            scope.toggle();
          }

          if (scope.$root && !scope.$root.$$phase) {
            scope.$apply();
          }

          return;
        });

        function adviseActiveChanged() {
          if (!angular.isUndefined(attrs.zfAdvise)) {
            foundationApi.publish(attrs.id, scope.active ? 'activated' : 'deactivated');
          }
        }

        function animate() {
          //animate both overlay and dialog
          if(!scope.overlay) {
            element.css('background', 'transparent');
          }

          // work around for modal animations
          // due to a bug where the overlay fadeIn is essentially covering up
          // the dialog's animation
          if (!scope.active) {
            foundationApi.animate(element, scope.active, overlayIn, overlayOut);
          }
          else {
            element.addClass('is-active');
          }

          animateFn(dialog, scope.active, animationIn, animationOut);
        }
      }
    }
  }

  ModalFactory.$inject = ['$http', '$templateCache', '$rootScope', '$compile', '$timeout', '$q', 'FoundationApi'];

  function ModalFactory($http, $templateCache, $rootScope, $compile, $timeout, $q, foundationApi) {
    return modalFactory;

    function modalFactory(config) {
      var self = this, //for prototype functions
          container = angular.element(config.container || document.body),
          id = config.id || foundationApi.generateUuid(),
          attached = false,
          destroyed = false,
          activated = false,
          html,
          element,
          fetched,
          scope,
          contentScope
      ;

      var props = [
        'animationIn',
        'animationOut',
        'overlay',
        'overlayClose',
        'ignoreAllClose',
        'class'
      ];

      if(config.templateUrl) {
        //get template
        fetched = $http.get(config.templateUrl, {
          cache: $templateCache
        }).then(function (response) {
          html = response.data;
          assembleDirective();
        });

      } else if(config.template) {
        //use provided template
        fetched = true;
        html = config.template;
        assembleDirective();
      }

      self.isActive = isActive;
      self.activate = activate;
      self.deactivate = deactivate;
      self.toggle = toggle;
      self.destroy = destroy;

      return {
        isActive: isActive,
        activate: activate,
        deactivate: deactivate,
        toggle: toggle,
        destroy: destroy
      };

      function checkStatus() {
        if(destroyed) {
          throw "Error: Modal was destroyed. Delete the object and create a new ModalFactory instance."
        }
      }

      function isActive() {
        return !destroyed && scope && activated;
      }

      function activate() {
        checkStatus();
        $timeout(function() {
          activated = true;
          init('show');
        }, 0, false);
      }

      function deactivate() {
        checkStatus();
        $timeout(function() {
          activated = false;
          init('hide');
        }, 0, false);
      }

      function toggle() {
        checkStatus();
        $timeout(function() {
          activated = !activated;
          init('toggle');
        }, 0, false);
      }

      function init(msg) {
        $q.when(fetched).then(function() {
          var delayMsg = false;

          if(!attached && html.length > 0) {
            container.append(element);
            $compile(element)(scope);
            attached = true;

            // delay message so directive can be compiled and respond to messages
            delayMsg = true;
          }

          if (delayMsg) {
            $timeout(function() {
              foundationApi.publish(id, msg);
            }, 0, false);
          } else {
            foundationApi.publish(id, msg);
          }
        });
      }

      function assembleDirective() {
        // check for duplicate elements to prevent factory from cloning modals
        if (document.getElementById(id)) {
          return;
        }

        html = '<zf-modal id="' + id + '">' + html + '</zf-modal>';

        element = angular.element(html);

        scope = $rootScope.$new();

        // account for directive attributes and modal classes
        for(var i = 0; i < props.length; i++) {
          var prop = props[i];

          if(angular.isDefined(config[prop])) {
            switch (prop) {
              case 'animationIn':
                element.attr('animation-in', config[prop]);
                break;
              case 'animationOut':
                element.attr('animation-out', config[prop]);
                break;
              case 'overlayClose':
                element.attr('overlay-close', (config[prop] === 'false' || config[prop] === false) ? 'false' : 'true'); // must be string, see postLink() above
                break;
              case 'ignoreAllClose':
                element.attr('zf-ignore-all-close', 'zf-ignore-all-close');
                break;
              case 'class':
                if (angular.isString(config[prop])) {
                  config[prop].split(' ').forEach(function(klass) {
                    element.addClass(klass);
                  });
                } else if (angular.isArray(config[prop])) {
                  config[prop].forEach(function(klass) {
                    element.addClass(klass);
                  });
                }
                break;
              default:
                element.attr(prop, config[prop]);
                break;
            }
          }
        }
        // access view scope variables
        if (config.contentScope) {
          contentScope = config.contentScope;
          for (var prop in config.contentScope) {
            if (config.contentScope.hasOwnProperty(prop)) {
              scope[prop] = config.contentScope[prop];
            }
          }
        }
      }

      function destroy() {
        self.deactivate();
        $timeout(function() {
          scope.$destroy();
          element.remove();
          destroyed = true;
        }, 0, false);
        foundationApi.unsubscribe(id);
      }

    }

  }

  ConfirmModal.$inject = ['$timeout', 'ModalFactory'];

  function ConfirmModal($timeout, ModalFactory) {
    var ConfirmModal = function(config) {
      var modal = this;

      ModalFactory.call(this, {
        'class': 'tiny dialog confirm-modal',
        'overlay': true,
        'overlayClose': false,
        'templateUrl': 'components/modal/modal-confirm.html',
        'contentScope': {
          title: config.title,
          content: config.content,
          enterText: config.enterText || "Enter",
          cancelText: config.cancelText || "Cancel",
          enterFirst: angular.isDefined(config.enterFirst) ? config.enterFirst : true,
          enter: function() {
            if (config.enterCallback) {
              config.enterCallback();
            }
            modal.deactivate();
            $timeout(function() {
              modal.destroy();
            }, 1000);
          },
          cancel: function() {
            if (config.cancelCallback) {
              config.cancelCallback();
            }
            modal.deactivate();
            $timeout(function() {
              modal.destroy();
            }, 1000);
          }
        }
      });

      modal.activate();
    }

    ConfirmModal.prototype = Object.create(ModalFactory.prototype);

    return ConfirmModal;
  }

  PromptModal.$inject = ['$timeout', 'ModalFactory'];

  function PromptModal($timeout, ModalFactory) {
    var PromptModal = function(config) {
      var modal = this;
      var data = {};

      ModalFactory.call(this, {
        'class': 'tiny dialog prompt-modal',
        'overlay': true,
        'overlayClose': false,
        'templateUrl': 'components/modal/modal-prompt.html',
        'contentScope': {
          title: config.title,
          content: config.content,
          data: data,
          inputType: config.inputType || "text",
          enterText: config.enterText || "Enter",
          cancelText: config.cancelText || "Cancel",
          enterFirst: angular.isDefined(config.enterFirst) ? config.enterFirst : true,
          enter: function() {
            if (!config.requireInput || (angular.isDefined(data.value) && data.value !== "")) {
              if (config.enterCallback) {
                config.enterCallback(data.value);
              }
              modal.deactivate();
              $timeout(function() {
                modal.destroy();
              }, 1000);
            }
          },
          cancel: function() {
            if (config.cancelCallback) {
              config.cancelCallback();
            }
            modal.deactivate();
            $timeout(function() {
              modal.destroy();
            }, 1000);
          }
        }
      });

      modal.activate();
    }

    PromptModal.prototype = Object.create(ModalFactory.prototype);

    return PromptModal;
  }

})();

(function() {
  'use strict';

  angular.module('foundation.notification', ['foundation.core'])
    .controller('ZfNotificationController', ZfNotificationController)
    .directive('zfNotificationSet', zfNotificationSet)
    .directive('zfNotification', zfNotification)
    .directive('zfNotificationStatic', zfNotificationStatic)
    .directive('zfNotify', zfNotify)
    .factory('NotificationFactory', NotificationFactory)
    .service('FoundationNotification', FoundationNotification)
  ;

  angular.module('base.notification', ['base.core'])
    .controller('ZfNotificationController', ZfNotificationController)
    .directive('zfNotificationSet', zfNotificationSet)
    .directive('zfNotification', zfNotification)
    .directive('zfNotificationStatic', zfNotificationStatic)
    .directive('zfNotify', zfNotify)
    .factory('NotificationFactory', NotificationFactory)
    .service('FoundationNotification', FoundationNotification)
  ;

  FoundationNotification.$inject = ['FoundationApi', 'NotificationFactory'];

  function FoundationNotification(foundationApi, NotificationFactory) {
    var service    = {};

    service.activate = activate;
    service.deactivate = deactivate;

    return service;

    //target should be element ID
    function activate(target) {
      foundationApi.publish(target, 'show');
    }

    //target should be element ID
    function deactivate(target) {
      foundationApi.publish(target, 'hide');
    }

    function toggle(target) {
      foundationApi.publish(target, 'toggle');
    }

    function createNotificationSet(config) {
      return new NotificationFactory(config);
    }
  }


  ZfNotificationController.$inject = ['$scope', 'FoundationApi'];

  function ZfNotificationController($scope, foundationApi) {
    var controller    = this;
    controller.notifications = $scope.notifications = $scope.notifications || [];

    controller.addNotification = function(info) {
      var id  = foundationApi.generateUuid();
      info.id = id;
      $scope.notifications.push(info);
    };

    controller.removeNotification = function(id) {
      $scope.notifications.forEach(function(notification) {
        if(notification.id === id) {
          var ind = $scope.notifications.indexOf(notification);
          $scope.notifications.splice(ind, 1);
        }
      });
    };

    controller.clearAll = function() {
      while($scope.notifications.length > 0) {
        $scope.notifications.pop();
      }
    };
  }

  zfNotificationSet.$inject = ['FoundationApi'];

  function zfNotificationSet(foundationApi) {
    var directive = {
      restrict: 'EA',
      templateUrl: 'components/notification/notification-set.html',
      controller: 'ZfNotificationController',
      replace: true,
      scope: {
        position: '@'
      },
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller) {
      scope.position = scope.position ? scope.position.split(' ').join('-') : 'top-right';

      scope.$on("$destroy", function() {
        foundationApi.unsubscribe(attrs.id);
      });

      foundationApi.subscribe(attrs.id, function(msg) {
        if(msg === 'clearall') {
          controller.clearAll();
        }
        else {
          controller.addNotification(msg);
          if (!scope.$root.$$phase) {
            scope.$apply();
          }
        }
      });
    }
  }

  zfNotification.$inject = ['FoundationApi', '$sce'];

  function zfNotification(foundationApi, $sce) {
    var directive = {
      restrict: 'EA',
      templateUrl: 'components/notification/notification.html',
      replace: true,
      transclude: true,
      require: '^zfNotificationSet',
      controller: function() { },
      scope: {
        title: '=?',
        content: '=?',
        image: '=?',
        notifId: '=',
        color: '=?',
        autoclose: '=?'
      },
      compile: compile
    };

    return directive;

    function compile() {

      return {
        pre: preLink,
        post: postLink
      };

      function preLink(scope, iElement, iAttrs) {
        iAttrs.$set('zf-closable', 'notification');
        if (iAttrs['title']) {
          scope.$watch('title', function(value) {
            if (value) {
              scope.trustedTitle = $sce.trustAsHtml(value);
            }
          });
        }
      }

      function postLink(scope, element, attrs, controller) {
        scope.active = false;
        var animationIn  = attrs.animationIn || 'fadeIn';
        var animationOut = attrs.animationOut || 'fadeOut';
        var animate = attrs.hasOwnProperty('zfAdvise') ? foundationApi.animateAndAdvise : foundationApi.animate;
        var hammerElem;

        //due to dynamic insertion of DOM, we need to wait for it to show up and get working!
        setTimeout(function() {
          scope.active = true;
          adviseActiveChanged();
          animate(element, scope.active, animationIn, animationOut);
        }, 50);

        scope.hide = function() {
          scope.active = false;
          adviseActiveChanged();
          animate(element, scope.active, animationIn, animationOut);
          setTimeout(function() {
            controller.removeNotification(scope.notifId);
          }, 50);
        };

        // close if autoclose
        if (scope.autoclose) {
          setTimeout(function() {
            if (scope.active) {
              scope.hide();
            }
          }, parseInt(scope.autoclose));
        };

        // close on swipe
        if (typeof(Hammer) !== 'undefined') {
          hammerElem = new Hammer(element[0]);
          // set the options for swipe (to make them a bit more forgiving in detection)
          hammerElem.get('swipe').set({
            direction: Hammer.DIRECTION_ALL,
            threshold: 5, // this is how far the swipe has to travel
            velocity: 0.5 // and this is how fast the swipe must travel
          });
        }
        if(typeof(hammerElem) !== 'undefined') {
          hammerElem.on('swipe', function() {
            if (scope.active) {
              scope.hide();
            }
          });
        }

        function adviseActiveChanged() {
          if (!angular.isUndefined(attrs.zfAdvise)) {
            foundationApi.publish(attrs.id, scope.active ? 'activated' : 'deactivated');
          }
        }
      }
    }
  }

  zfNotificationStatic.$inject = ['FoundationApi', '$sce'];

  function zfNotificationStatic(foundationApi, $sce) {
    var directive = {
      restrict: 'EA',
      templateUrl: 'components/notification/notification-static.html',
      replace: true,
      transclude: true,
      scope: {
        title: '@?',
        content: '@?',
        image: '@?',
        color: '@?',
        autoclose: '@?'
      },
      compile: compile
    };

    return directive;

    function compile() {
      var type = 'notification';

      return {
        pre: preLink,
        post: postLink
      };

      function preLink(scope, iElement, iAttrs, controller) {
        iAttrs.$set('zf-closable', type);
        if (iAttrs['title']) {
          scope.trustedTitle = $sce.trustAsHtml(iAttrs['title']);
        }
      }

      function postLink(scope, element, attrs, controller) {
        scope.position = attrs.position ? attrs.position.split(' ').join('-') : 'top-right';

        var animationIn = attrs.animationIn || 'fadeIn';
        var animationOut = attrs.animationOut || 'fadeOut';
        var animateFn = attrs.hasOwnProperty('zfAdvise') ? foundationApi.animateAndAdvise : foundationApi.animate;

        scope.$on("$destroy", function() {
          foundationApi.unsubscribe(attrs.id);
        });

        //setup
        foundationApi.subscribe(attrs.id, function(msg) {
          if(msg == 'show' || msg == 'open') {
            scope.show();
            // close if autoclose
            if (scope.autoclose) {
              setTimeout(function() {
                if (scope.active) {
                  scope.hide();
                }
              }, parseInt(scope.autoclose));
            };
          } else if (msg == 'close' || msg == 'hide') {
            scope.hide();
          } else if (msg == 'toggle') {
            scope.toggle();
            // close if autoclose
            if (scope.autoclose) {
              setTimeout(function() {
                if (scope.active) {
                  scope.toggle();
                }
              }, parseInt(scope.autoclose));
            }
          }
          return;
        });

        scope.hide = function() {
          if (scope.active) {
            scope.active = false;
            adviseActiveChanged();
            animateFn(element, scope.active, animationIn, animationOut);
          }
          return;
        };

        scope.show = function() {
          if (!scope.active) {
            scope.active = true;
            adviseActiveChanged();
            animateFn(element, scope.active, animationIn, animationOut);
          }
          return;
        };

        scope.toggle = function() {
          scope.active = !scope.active;
          adviseActiveChanged();
          animateFn(element, scope.active, animationIn, animationOut);
          return;
        };

        function adviseActiveChanged() {
          if (!angular.isUndefined(attrs.zfAdvise)) {
            foundationApi.publish(attrs.id, scope.active ? 'activated' : 'deactivated');
          }
        }
      }
    }
  }

  zfNotify.$inject = ['FoundationApi'];

  function zfNotify(foundationApi) {
    var directive = {
      restrict: 'A',
      scope: {
        title: '@?',
        content: '@?',
        color: '@?',
        image: '@?',
        autoclose: '@?'
      },
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller) {
      element.on('click', function(e) {
        foundationApi.publish(attrs.zfNotify, {
          title: scope.title,
          content: scope.content,
          color: scope.color,
          image: scope.image,
          autoclose: scope.autoclose
        });
        e.preventDefault();
      });
    }
  }

  NotificationFactory.$inject = ['$http', '$templateCache', '$rootScope', '$compile', '$timeout', 'FoundationApi', '$sce'];

  function NotificationFactory($http, $templateCache, $rootScope, $compile, $timeout, foundationApi, $sce) {
    return notificationFactory;

    function notificationFactory(config) {
      var self = this, //for prototype functions
          container = angular.element(config.container || document.body),
          id = config.id || foundationApi.generateUuid(),
          attached = false,
          destroyed = false,
          html,
          element,
          scope,
          contentScope
      ;

      var props = [
        'position'
      ];

      assembleDirective();

      self.addNotification = addNotification;
      self.clearAll = clearAll;
      self.destroy = destroy;

      return {
        addNotification: addNotification,
        clearAll: clearAll,
        destroy: destroy
      };

      function checkStatus() {
        if(destroyed) {
          throw "Error: Notification Set was destroyed. Delete the object and create a new NotificationFactory instance."
        }
      }

      function addNotification(notification) {
        checkStatus();
        $timeout(function() {
          foundationApi.publish(id, notification);
        }, 0, false);
      }

      function clearAll() {
        checkStatus();
        $timeout(function() {
          foundationApi.publish(id, 'clearall');
        }, 0, false);
      }

      function init(state) {
        if(!attached && html.length > 0) {
          var modalEl = container.append(element);

          scope.active = state;
          $compile(element)(scope);

          attached = true;
        }
      }

      function assembleDirective() {
        // check for duplicate element to prevent factory from cloning notification sets
        if (document.getElementById(id)) {
          return;
        }
        html = '<zf-notification-set id="' + id + '"></zf-notification-set>';

        element = angular.element(html);

        scope = $rootScope.$new();

        for(var i = 0; i < props.length; i++) {
          if(config[props[i]]) {
            element.attr(props[i], config[props[i]]);
          }
        }

        // access view scope variables
        if (config.contentScope) {
          contentScope = config.contentScope;
          for (var prop in contentScope) {
            if (contentScope.hasOwnProperty(prop)) {
              scope[prop] = contentScope[prop];
            }
          }
        }
        init(true);
      }

      function destroy() {
        self.clearAll();
        setTimeout(function() {
          scope.$destroy();
          element.remove();
          destroyed = true;
        }, 3000);
        foundationApi.unsubscribe(id);
      }

    }

  }
})();

(function() {
  'use strict';

  angular.module('foundation.offcanvas', ['foundation.core'])
    .directive('zfOffcanvas', zfOffcanvas)
    .service('FoundationOffcanvas', FoundationOffcanvas)
  ;

  angular.module('base.offcanvas', ['base.core'])
    .directive('zfOffcanvas', zfOffcanvas)
    .service('FoundationOffcanvas', FoundationOffcanvas)
  ;

  FoundationOffcanvas.$inject = ['FoundationApi'];

  function FoundationOffcanvas(foundationApi) {
    var service    = {};

    service.activate = activate;
    service.deactivate = deactivate;

    return service;

    //target should be element ID
    function activate(target) {
      foundationApi.publish(target, 'show');
    }

    //target should be element ID
    function deactivate(target) {
      foundationApi.publish(target, 'hide');
    }

    function toggle(target) {
      foundationApi.publish(target, 'toggle');
    }
  }

  zfOffcanvas.$inject = ['FoundationApi'];

  function zfOffcanvas(foundationApi) {
    var directive = {
      restrict: 'EA',
      templateUrl: 'components/offcanvas/offcanvas.html',
      transclude: true,
      scope: {
        position: '@'
      },
      replace: true,
      compile: compile
    };

    return directive;

    function compile(tElement, tAttrs, transclude) {
      var type = 'offcanvas';

      return {
        pre: preLink,
        post: postLink
      };

      function preLink(scope, iElement, iAttrs, controller) {
        iAttrs.$set('zf-closable', type);
        document.body.classList.add('has-off-canvas');
      }

      function postLink(scope, element, attrs) {
        scope.position = scope.position || 'left';
        scope.active = false;

        scope.$on("$destroy", function() {
          foundationApi.unsubscribe(attrs.id);
        });

        //setup
        foundationApi.subscribe(attrs.id, function(msg) {
          if(msg === 'show' || msg === 'open') {
            scope.show();
          } else if (msg === 'close' || msg === 'hide') {
            scope.hide();
          } else if (msg === 'toggle') {
            scope.toggle();
          }

          if (!scope.$root.$$phase) {
            scope.$apply();
          }

          return;
        });

        scope.hide = function() {
          scope.active = false;
          adviseActiveChanged();
          return;
        };

        scope.show = function() {
          scope.active = true;
          adviseActiveChanged();
          return;
        };

        scope.toggle = function() {
          scope.active = !scope.active;
          adviseActiveChanged();
          return;
        };

        function adviseActiveChanged() {
          if (!angular.isUndefined(attrs.zfAdvise)) {
            foundationApi.publish(attrs.id, scope.active ? 'activated' : 'deactivated');
          }
        }
      }
    }
  }

})();

(function() {
  'use strict';

  angular.module('foundation.panel', ['foundation.core'])
    .directive('zfPanel', zfPanel)
    .service('FoundationPanel', FoundationPanel)
  ;

  angular.module('base.panel', ['base.core'])
    .directive('zfPanel', zfPanel)
    .service('FoundationPanel', FoundationPanel)
  ;

  FoundationPanel.$inject = ['FoundationApi'];

  function FoundationPanel(foundationApi) {
    var service    = {};

    service.activate = activate;
    service.deactivate = deactivate;

    return service;

    //target should be element ID
    function activate(target) {
      foundationApi.publish(target, 'show');
    }

    //target should be element ID
    function deactivate(target) {
      foundationApi.publish(target, 'hide');
    }
  }

  zfPanel.$inject = ['FoundationApi', '$window'];

  function zfPanel(foundationApi, $window) {
    var directive = {
      restrict: 'EA',
      templateUrl: 'components/panel/panel.html',
      transclude: true,
      scope: {
        position: '@?'
      },
      replace: true,
      compile: compile
    };

    return directive;

    function compile(tElement, tAttrs, transclude) {
      var type = 'panel';
      var animate = tAttrs.hasOwnProperty('zfAdvise') ? foundationApi.animateAndAdvise : foundationApi.animate;
      var forceAnimation = tAttrs.hasOwnProperty('forceAnimation');

      return {
        pre: preLink,
        post: postLink
      };

      function preLink(scope, iElement, iAttrs, controller) {
        iAttrs.$set('zf-closable', type);
        scope.position = scope.position || 'left';
        scope.positionClass = 'panel-' + scope.position;
      }

      function postLink(scope, element, attrs) {
        scope.active = false;
        var animationIn, animationOut;
        var globalQueries = foundationApi.getSettings().mediaQueries;
        var setAnim = {
          left: function(){
            animationIn  = attrs.animationIn || 'slideInRight';
            animationOut = attrs.animationOut || 'slideOutLeft';
          },
          right: function(){
            animationIn  = attrs.animationIn || 'slideInLeft';
            animationOut = attrs.animationOut || 'slideOutRight';
          },
          top: function(){
            animationIn  = attrs.animationIn || 'slideInDown';
            animationOut = attrs.animationOut || 'slideOutUp';
          },
          bottom: function(){
            animationIn  = attrs.animationIn || 'slideInUp';
            animationOut = attrs.animationOut || 'slideOutDown';
          }
        };
        setAnim[scope.position]();
        //urgh, there must be a better way, ***there totally is btw***
        // if(scope.position === 'left') {
        //   animationIn  = attrs.animationIn || 'slideInRight';
        //   animationOut = attrs.animationOut || 'slideOutLeft';
        // } else if (scope.position === 'right') {
        //   animationIn  = attrs.animationIn || 'slideInLeft';
        //   animationOut = attrs.animationOut || 'slideOutRight';
        // } else if (scope.position === 'top') {
        //   animationIn  = attrs.animationIn || 'slideInDown';
        //   animationOut = attrs.animationOut || 'slideOutUp';
        // } else if (scope.position === 'bottom') {
        //   animationIn  = attrs.animationIn || 'slideInUp';
        //   animationOut = attrs.animationOut || 'slideOutDown';
        // }

        scope.$on("$destroy", function() {
          foundationApi.unsubscribe(attrs.id);
        });

        //setup
        foundationApi.subscribe(attrs.id, function(msg) {
          var panelPosition = $window.getComputedStyle(element[0]).getPropertyValue("position");

          if (!forceAnimation) {
            // patch to prevent panel animation on larger screen devices
            // don't run animation on grid elements, only panel
            if (panelPosition == 'static' || panelPosition == 'relative') {
              return;
            }
          }

          if(msg == 'show' || msg == 'open') {
            scope.show();
          } else if (msg == 'close' || msg == 'hide') {
            scope.hide();
          } else if (msg == 'toggle') {
            scope.toggle();
          }

          if (!scope.$root.$$phase) {
            scope.$apply();
          }

          return;
        });

        scope.hide = function() {
          if(scope.active){
            scope.active = false;
            adviseActiveChanged();
            animate(element, scope.active, animationIn, animationOut);
          }

          return;
        };

        scope.show = function() {
          if(!scope.active){
            scope.active = true;
            adviseActiveChanged();
            animate(element, scope.active, animationIn, animationOut);
          }

          return;
        };

        scope.toggle = function() {
          scope.active = !scope.active;
          adviseActiveChanged();
          animate(element, scope.active, animationIn, animationOut);
          return;
        };

        element.on('click', function(e) {
          // Check sizing
          var srcEl = e.target;

          if (!matchMedia(globalQueries.medium).matches && srcEl.href && srcEl.href.length > 0) {
            // Hide element if it can't match at least medium
            scope.hide();
          }
        });

        function adviseActiveChanged() {
          if (!angular.isUndefined(attrs.zfAdvise)) {
            foundationApi.publish(attrs.id, scope.active ? 'activated' : 'deactivated');
          }
        }
      }
    }
  }

})();

(function() {
  'use strict';

  angular.module('foundation.popup', ['foundation.core'])
    .directive('zfPopup', zfPopup)
    .directive('zfPopupToggle', zfPopupToggle)
    .service('FoundationPopup', FoundationPopup)
  ;

  angular.module('base.popup', ['base.core'])
    .directive('zfPopup', zfPopup)
    .directive('zfPopupToggle', zfPopupToggle)
    .service('FoundationPopup', FoundationPopup)
  ;

  FoundationPopup.$inject = ['FoundationApi'];

  function FoundationPopup(foundationApi) {
    var service    = {};

    service.activate = activate;
    service.deactivate = deactivate;

    return service;

    //target should be element ID
    function activate(target) {
      foundationApi.publish(target, ['show']);
    }

    //target should be element ID
    function deactivate(target) {
      foundationApi.publish(target, ['hide']);
    }

    function toggle(target, popupTarget) {
      foundationApi.publish(target, ['toggle', popupTarget]);
    }
  }

  zfPopup.$inject = ['FoundationApi'];

  function zfPopup(foundationApi) {
    var directive = {
      restrict: 'EA',
      transclude: true,
      replace: true,
      templateUrl: 'components/popup/popup.html',
      scope: {
        pinTo: '@?',
        pinAt: '@?',
        target: '@?'
      },
      compile: compile
    };

    return directive;

    function compile() {
      return {
        pre: preLink,
        post: postLink
      };

      function preLink(scope, iElement, iAttrs) {
        iAttrs.$set('zf-closable', 'popup');
      }

      function postLink(scope, element, attrs) {
        scope.active = false;
        scope.target = scope.target || false;

        var attachment = scope.pinTo || 'top center';
        var targetAttachment = scope.pinAt || 'bottom center';
        var tetherInit = false;
        var tether     = {};

        //setup
        foundationApi.subscribe(attrs.id, function(msg) {
          if(msg[0] === 'show' || msg[0] === 'open') {
            scope.show(msg[1]);
          } else if (msg[0] === 'close' || msg[0] === 'hide') {
            scope.hide();
          } else if (msg[0] === 'toggle') {
            scope.toggle(msg[1]);
          }

          scope.$apply();

          return;
        });


        scope.hide = function() {
          if (scope.active) {
            scope.active = false;
            adviseActiveChanged();
            tetherElement();
            tether.disable();
          }

          return;
        };

        scope.show = function(newTarget) {
          if (!scope.active) {
            scope.active = true;
            adviseActiveChanged();
            tetherElement(newTarget);
            tether.enable();
          }

          return;
        };

        scope.toggle = function(newTarget) {
          scope.active = !scope.active;
          adviseActiveChanged();
          tetherElement(newTarget);

          if(scope.active) {
            tether.enable();
          } else  {
            tether.disable();
          }

          return;
        };

        scope.$on('$destroy', function() {
          foundationApi.unsubscribe(attrs.id);

          scope.active = false;
          if(tetherInit) {
            tether.destroy();
            element.remove();
            tetherInit = false;
          }
        });

        function tetherElement(target) {
          if(tetherInit) {
            return;
          }

          scope.target = scope.target ? document.getElementById(scope.target) : document.getElementById(target);

          tether = new Tether({
            element: element[0],
            target: scope.target,
            attachment: attachment,
            targetAttachment: targetAttachment,
            enable: false
          });

          tetherInit = true;
        }

        function adviseActiveChanged() {
          if (!angular.isUndefined(attrs.zfAdvise)) {
            foundationApi.publish(attrs.id, scope.active ? 'activated' : 'deactivated');
          }
        }
      }
    }
  }

  zfPopupToggle.$inject = ['FoundationApi'];

  function zfPopupToggle(foundationApi) {
    var directive = {
      restrict: 'A',
      link: link
    };

    return directive;

    function link(scope, element, attrs) {
      var target = attrs.zfPopupToggle;
      var id = attrs.id || foundationApi.generateUuid();
      attrs.$set('id', id);

      element.on('click', function(e) {
        foundationApi.publish(target, ['toggle', id]);
        e.preventDefault();
      });
    }
  }

})();

(function() {
  'use strict';

  angular.module('foundation.tabs', ['foundation.core'])
    .controller('ZfTabsController', ZfTabsController)
    .directive('zfTabs', zfTabs)
    .directive('zfTabContent', zfTabContent)
    .directive('zfTab', zfTab)
    .directive('zfTabIndividual', zfTabIndividual)
    .directive('zfTabHref', zfTabHref)
    .directive('zfTabCustom', zfTabCustom)
    .directive('zfTabContentCustom', zfTabContentCustom)
    .service('FoundationTabs', FoundationTabs)
  ;

  angular.module('base.tabs', ['base.core'])
    .controller('ZfTabsController', ZfTabsController)
    .directive('zfTabs', zfTabs)
    .directive('zfTabContent', zfTabContent)
    .directive('zfTab', zfTab)
    .directive('zfTabIndividual', zfTabIndividual)
    .directive('zfTabHref', zfTabHref)
    .directive('zfTabCustom', zfTabCustom)
    .directive('zfTabContentCustom', zfTabContentCustom)
    .service('FoundationTabs', FoundationTabs)
  ;

  FoundationTabs.$inject = ['FoundationApi'];

  function FoundationTabs(foundationApi) {
    var service    = {};

    service.activate = activate;

    return service;

    //target should be element ID
    function activate(target) {
      foundationApi.publish(target, 'show');
    }

  }

  ZfTabsController.$inject = ['$scope', 'FoundationApi'];

  function ZfTabsController($scope, foundationApi) {
    var controller  = this;
    var tabs        = controller.tabs = $scope.tabs = [];
    var id          = '';
    var autoOpen    = true;
    var collapsible = false;

    controller.select = function(selectTab) {
      tabs.forEach(function(tab) {
        if(tab.scope === selectTab) {
          if (collapsible) {
            tab.active = !tab.active;
            tab.scope.active = !tab.scope.active;
          } else {
            tab.active = true;
            tab.scope.active = true;
          }

          if (tab.active) {
            foundationApi.publish(id, ['activate', tab.scope.id]);
          } else {
            foundationApi.publish(id, ['deactivate', tab.scope.id]);
          }
        } else {
          tab.active = false;
          tab.scope.active = false;
        }
      });
    };

    controller.addTab = function addTab(tabScope) {
      tabs.push({ scope: tabScope, active: false, parentContent: controller.id });

      if(tabs.length === 1 && autoOpen) {
        tabs[0].active = true;
        tabScope.active = true;
      }
    };

    controller.getId = function() {
      return id;
    };

    controller.setId = function(newId) {
      id = newId;
    };

    controller.setAutoOpen = function(val) {
      autoOpen = val;
    };

    controller.setCollapsible = function(val) {
      collapsible = val;
    };
  }

  zfTabs.$inject = ['FoundationApi'];

  function zfTabs(foundationApi) {
    var directive = {
      restrict: 'EA',
      transclude: 'true',
      replace: true,
      templateUrl: 'components/tabs/tabs.html',
      controller: 'ZfTabsController',
      scope: {
        displaced: '@?'
      },
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller) {
      scope.id = attrs.id || foundationApi.generateUuid();
      scope.showTabContent = scope.displaced !== 'true';
      attrs.$set('id', scope.id);
      controller.setId(scope.id);
      controller.setAutoOpen(attrs.autoOpen !== "false");
      controller.setCollapsible(attrs.collapsible === "true");

      //update tabs in case tab-content doesn't have them
      var updateTabs = function() {
        foundationApi.publish(scope.id + '-tabs', scope.tabs);
      };

      foundationApi.subscribe(scope.id + '-get-tabs', function() {
        updateTabs();
      });

      scope.$on("$destroy", function() {
        foundationApi.unsubscribe(scope.id + '-get-tabs');
      });
    }
  }

  zfTabContent.$inject = ['FoundationApi'];

  function zfTabContent(foundationApi) {
    var directive = {
      restrict: 'A',
      transclude: 'true',
      replace: true,
      scope: {
        tabs: '=?',
        target: '@'
      },
      templateUrl: 'components/tabs/tab-content.html',
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller) {
      scope.tabs = scope.tabs || [];
      var id = scope.target;

      foundationApi.subscribe(id, function(msg) {
        if(msg[0] === 'activate') {
          scope.tabs.forEach(function (tab) {
            tab.scope.active = false;
            tab.active = false;

            if(tab.scope.id == msg[1]) {
              tab.scope.active = true;
              tab.active = true;
            }
          });
        } else if (msg[0] === 'deactivate') {
          scope.tabs.forEach(function (tab) {
            tab.scope.active = false;
            tab.active = false;
          });
        }
      });

      //if tabs empty, request tabs
      if(scope.tabs.length === 0) {
        foundationApi.subscribe(id + '-tabs', function(tabs) {
          scope.tabs = tabs;
        });

        foundationApi.publish(id + '-get-tabs', '');
      }

      scope.$on("$destroy", function() {
        foundationApi.unsubscribe(id);
        foundationApi.unsubscribe(id + '-tabs');
      });
    }
  }

  zfTab.$inject = ['FoundationApi'];

  function zfTab(foundationApi) {
    var directive = {
      restrict: 'EA',
      templateUrl: 'components/tabs/tab.html',
      transclude: true,
      scope: {
        title: '@'
      },
      require: '^zfTabs',
      replace: true,
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller, transclude) {
      scope.id = attrs.id || foundationApi.generateUuid();
      scope.active = false;
      scope.transcludeFn = transclude;
      controller.addTab(scope);

      foundationApi.subscribe(scope.id, function(msg) {
        if(msg === 'show' || msg === 'open' || msg === 'activate') {
          if (!scope.active) {
            controller.select(scope);
          }
        }

        if(msg === 'hide' || msg === 'close' || msg === 'deactivate') {
          if (scope.active) {
            controller.select(scope);
          }
        }

        if(msg === 'toggle') {
          controller.select(scope);
        }
      });

      scope.makeActive = function() {
        controller.select(scope);
      };

      scope.$on("$destroy", function() {
        foundationApi.unsubscribe(scope.id);
      });
    }
  }

  zfTabIndividual.$inject = ['FoundationApi'];

  function zfTabIndividual(foundationApi) {
    var directive = {
      restrict: 'EA',
      transclude: 'true',
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller, transclude) {
      var tab = scope.$eval(attrs.tab);
      var id = tab.scope.id;

      tab.scope.transcludeFn(tab.scope, function(tabContent) {
        element.append(tabContent);
      });

      foundationApi.subscribe(tab.scope.id, function(msg) {
        foundationApi.publish(tab.parentContent, ['activate', tab.scope.id]);
        scope.$apply();
      });

      scope.$on("$destroy", function() {
        foundationApi.unsubscribe(tab.scope.id);
      });
    }
  }

  //custom tabs

  zfTabHref.$inject = ['FoundationApi'];

  function zfTabHref(foundationApi) {
    var directive = {
      restrict: 'A',
      replace: false,
      link: link
    }

    return directive;

    function link(scope, element, attrs, controller) {
      var target = attrs.zfTabHref;

      foundationApi.subscribe(target, function(msg) {
        if(msg === 'activate' || msg === 'show' || msg === 'open') {
          makeActive();
        }
      });


      element.on('click', function(e) {
        foundationApi.publish(target, 'activate');
        makeActive();
        e.preventDefault();
      });

      function makeActive() {
        element.parent().children().removeClass('is-active');
        element.addClass('is-active');
      }
    }
  }

  zfTabCustom.$inject = ['FoundationApi'];

  function zfTabCustom(foundationApi) {
    var directive = {
      restrict: 'A',
      replace: false,
      link: link
    };

    return directive;

    function link(scope, element, attrs, controller, transclude) {
      var children = element.children();
      angular.element(children[0]).addClass('is-active');
    }
  }

  zfTabContentCustom.$inject = ['FoundationApi'];

  function zfTabContentCustom(foundationApi) {
    return {
      restrict: 'A',
      link: link
    };

    function link(scope, element, attrs) {
      var tabs = [];
      var children = element.children();

      angular.forEach(children, function(node) {
        if(node.id) {
          var tabId = node.id;
          tabs.push(tabId);
          foundationApi.subscribe(tabId, function(msg) {
            if(msg === 'activate' || msg === 'show' || msg === 'open') {
              activateTabs(tabId);
            }
          });

          if(tabs.length === 1) {
            var el = angular.element(node);
            el.addClass('is-active');
          }
        }
      });

      function activateTabs(tabId) {
        var tabNodes = element.children();
        angular.forEach(tabNodes, function(node) {
          var el = angular.element(node);
          el.removeClass('is-active');
          if(el.attr('id') === tabId) {
            el.addClass('is-active');
          }
        });
      }
    }
  }

})();

(function() {
  'use strict';

  // imports all components and dependencies under a single namespace

  angular.module('foundation', [
    'foundation.core',
    'foundation.mediaquery',
    'foundation.accordion',
    'foundation.actionsheet',
    'foundation.common',
    'foundation.iconic',
    'foundation.interchange',
    'foundation.modal',
    'foundation.notification',
    'foundation.offcanvas',
    'foundation.panel',
    'foundation.popup',
    'foundation.tabs'
  ]);

  angular.module('base', [
    'base.core',
    'base.mediaquery',
    'base.accordion',
    'base.actionsheet',
    'base.common',
    'base.iconic',
    'base.interchange',
    'base.modal',
    'base.notification',
    'base.offcanvas',
    'base.panel',
    'base.popup',
    'base.tabs'
  ]);


})();
