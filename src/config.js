import kebabCase from 'lodash.kebabcase';
import each from 'lodash.foreach';

// Allows for easier definition in state method
//    component: 'routeName'
// instead of
//    template: '<route-name></route-name>'
const extendWithTemplate = opts => {
  if(opts.component && typeof opts.component === 'string') {
    const kebab = kebabCase(opts.component);
    opts.template = `<${kebab}></${kebab}>`;
  }
  return opts;
};

const extendTemplateWithResolves = opts => {
  if(opts.componentBindings && Array.isArray(opts.componentBindings)) {
    // Extend template with resolves
    const template = opts.template.split('></');
    template[0] += opts.componentBindings.map(b => ` ${kebabCase(b)}="stateCtrl.${b}"`).join('');
    opts.template = template.join('></');

    // Controller to bind resolves to component
    const controller = function(...args) {
      each(opts.componentBindings, (b, i) => this[b] = args[i]);
    };
    opts.controller = opts.componentBindings.concat([controller]);
    opts.controllerAs = 'stateCtrl';
  }
  return opts;
};

const extendRoutewithResolves = (opts, $provide) => {
  if (opts.component && typeof opts.component === 'string') {
    $provide.decorator(`${opts.component}Directive`, ['$delegate', $delegate => {
      each(opts.componentBindings, b => $delegate[0].bindToController[b] = '<');
      // opts.resolve = extend(opts.resolve, $delegate[0].resolve);
      return $delegate;
    }]);
  }
  return opts;
};

// Any resolves defined as string are converted to Resolver items
const addResolves = opts => {
  if(opts.resolve && (opts.resolve instanceof Object || Array.isArray(opts.resolve))) {
    const resolve = opts.resolve;
    if(Array.isArray(opts.resolve)) opts.resolve = {};
    each(resolve, (r, name) => {
      if(typeof r === 'string') opts.resolve[typeof name === 'string' ? name : r] = ['Resolver', Resolver => Resolver.resolve(r)];
    });
  }
  return opts;
};

const config = ['$stateProvider', '$provide', ($stateProvider, $provide) => {
  const state = $stateProvider.state;
  $stateProvider.state = (name, opts) => {
    opts = extendWithTemplate(opts);
    opts = extendTemplateWithResolves(opts);
    opts = extendRoutewithResolves(opts, $provide);
    opts = addResolves(opts);
    // Call original state method
    state(name, opts);
    return $stateProvider;
  };
}];

export default config;
