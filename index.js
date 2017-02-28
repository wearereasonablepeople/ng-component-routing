const uiRouter = require('angular-ui-router');
const config = require('./src/config.js');
const Resolver = require('./src/Resolver.js');
const thisModuleName = 'warp.componentRouting';

const ngComponentRouting = function(angular) {


  // Route method on angular.module()
  const addRoute = (name, component, moduleName) => {
    const module = angular.module(moduleName);
    module.requires.push(thisModuleName);
    module.component(name, component);
    module.config(['$stateProvider', $stateProvider => {
      component.routeOpts.component = component.routeOpts.component || name;
      $stateProvider.state(component.routeOpts.name, component.routeOpts);
    }]);
  };

  // Enhance angular.module() with route method
  const orig = angular.module;
  const alreadyRegistered = {};
  angular.module = (name, reqs, configFn) => {
    const module = alreadyRegistered[name] ? orig(name) : orig(name, reqs, configFn);
    if(alreadyRegistered[name]) {
      module.requires.push.apply(module.requires, reqs);
    } else {
      alreadyRegistered[name] = module;
    }
    module.route = (n, c) => addRoute(n, c, module.name);
    return module;
  };

  // Create module
  angular.module(thisModuleName, [uiRouter])
    .config(config)
    .service('Resolver', Resolver);

  return angular;
};
module.exports = ngComponentRouting;
