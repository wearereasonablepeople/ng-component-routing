import {extend, each, isString, isArray, isObject, isFunction, kebabCase} from 'lodash';
import angular from 'angular';
import uiRouter from 'angular-ui-router';

angular.module('warp.componentRouting', [uiRouter]).config(($stateProvider, $provide) => {
  'ngInject';

  const state = $stateProvider.state;
  $stateProvider.state = (name, opts) => {
    // Allows for easier definition in state method
    //    component: 'routeName'
    // instead of
    //    template: '<route-name></route-name>'
    if (opts.component && isString(opts.component)) {
      const kebab = kebabCase(opts.component);
      opts.template = `<${kebab}></${kebab}>`;
    }

    if (opts.componentBindings && isArray(opts.componentBindings)) {
      // Extend template with resolves
      const template = opts.template.split('></');
      template[0] += opts.componentBindings.map(b => ` ${kebabCase(b)}="stateCtrl.${b}"`).join('');
      opts.template = template.join('></');

      // Controller to bind resolves to component
      const controller =  function(...args) {
        each(opts.componentBindings, (b, i) => this[b] = args[i]);
      };
      opts.controller = opts.componentBindings.concat([controller]);
      opts.controllerAs = 'stateCtrl';

      // Extend route component with resolves
      if (opts.component && isString(opts.component)) {
        $provide.decorator(`${opts.component}Directive`, $delegate => {
          each(opts.componentBindings, b => $delegate[0].bindToController[b] = '<');
          // opts.resolve = extend(opts.resolve, $delegate[0].resolve);
          return $delegate;
        });
      }
    }

    // Any resolves defined as string are converted to Resolver items
    if(opts.resolve && (isObject(opts.resolve) || isArray(opts.resolve))) {
      const resolve = opts.resolve;
      if(isArray(opts.resolve)) opts.resolve = {};
      each(resolve, (r, name) => {
        if(isString(r)) opts.resolve[isString(name) ? name : r] = ['Resolver', Resolver => Resolver.resolve(r)];
      });
    }

    // Call original state method
    state(name, opts);
    return $stateProvider;
  };
}).service('Resolver', function($q, $resolve, $injector, $rootScope) {
  'ngInject';
  this.items = {};

  // Returns the item that needs to be resolved
  this.resolve = name => this.items[name];

  $rootScope.$on('$stateChangeStart', (e, toState) => {
    each(toState.resolve, (r, key) => {
      toState.resolve[key] = this.resolve(key) || r;
    });
  });

  // See this.add
  const addItem = (item, itemName) => {
    if(this.items[itemName]) console.warn(`Resolver item %c'${itemName}' %cwas overwritten`, 'color: blue', 'color: black');
    this.items[itemName] = item;
  };

  // Add a reusable resolve function. This function can be used by name in the state definition.
  // Accepts params as (name, fn) and ({name: fn, name2: fn2})

  //   In run block:
  //   Resolver.add('myFn', ['MyService', MyService => MyService.myMethod()]);
  //
  //   In config block:
  //   .state('myState', {
  //     component: 'myComponent',
  //     resolve: {
  //       example: 'myFn'
  //     } 
  //   })
  //   .state('myState2', {
  //     component: 'myComponent2',
  //     resolve: {
  //       example: 'myFn'
  //     } 
  //   })

  // instead of

  //   .state('myState', {
  //     component: 'myComponent',
  //     resolve: {
  //       example: ['MyService', MyService => MyService.myMethod()]
  //     } 
  //   })
  //   .state('myState2', {
  //     component: 'myComponent2',
  //     resolve: {
  //       example: ['MyService', MyService => MyService.myMethod()]
  //     } 
  //   })

  this.add = (nameOrItems, fn) => {
    if(isObject(nameOrItems)) each(nameOrItems, addItem);
    if(isString(nameOrItems)) addItem(fn, nameOrItems);
    return this;
  };
});

const addRoute = (name, component, moduleName) => {
	const module = angular.module(moduleName);
	module.requires.push('warp.componentRouting');
	module.component(name, component);
	module.config($stateProvider => {
		component.routeOpts.component = component.routeOpts.component || name;
		$stateProvider.state(component.routeOpts.name, component.routeOpts);
	});
};

const routeWrap = ng => {
	const orig = ng.module;
	ng.module = (...args) => {
		const module = orig.apply(ng, args);
		module.route = (n, c) => addRoute(n, c, module.name);
		return module;
	};
	return ng;
};

export default routeWrap;
