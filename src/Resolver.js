import kebabCase from 'lodash.kebabcase';
import {forEach as each} from 'lodash.foreach';

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
  this.add = (nameOrItems, fn) => {
    if(nameOrItems instanceof Object) each(nameOrItems, addItem);
    if(typeof nameOrItems === 'string') addItem(fn, nameOrItems);
    return this;
  };
}];

export default Resolver;