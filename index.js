const uiRouter = require('angular-ui-router');
const config = require('./src/config.js');
const Resolver = require('./src/Resolver.js');
const thisModuleName = 'warp.componentRouting';

const ngComponentRouting = function(angular) {
  // Create module
  angular.module(thisModuleName, [uiRouter])
    .config(config)
    .service('Resolver', Resolver);

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
  angular.module = (...args) => {
    const module = orig.apply(null, args);
    module.route = (n, c) => addRoute(n, c, module.name);
    return module;
  };

  return angular;
};
module.exports = ngComponentRouting;
