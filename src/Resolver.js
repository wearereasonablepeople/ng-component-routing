const {extend, each, isString, isArray, isObject, isFunction, kebabCase} = require('lodash');

const Resolver = ['$q', '$resolve', '$injector', '$rootScope', '$state', function($q, $resolve, $injector, $rootScope, $state) {
  this.items = {};

  // Returns the item that needs to be resolved
  this.resolve = name => this.items[name];

  const applyResolves = state => {
    each(state.resolve, (r, key) => {
      state.resolve[key] = this.resolve(key) || r;
    });

    const parent = $state.get(state.parent);
    if(parent) {
      applyResolves(parent);
    }
  };

  $rootScope.$on('$stateChangeStart', (e, toState) => applyResolves(toState));

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
}];

module.exports = Resolver;