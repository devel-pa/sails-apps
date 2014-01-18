/**
 * Module dependencies.
 */

var _ = require('lodash'),
	util = require('sails-util');


/**
 * Expose route parser.
 * @type {Function}
 */
module.exports = function (sails) {
	return interpretRouteSyntax;


	/**
	 * interpretRouteSyntax
	 * 
	 * "Teach" router to understand references to controllers.
	 * 
	 * @param  {[type]} route [description]
	 * @return {[type]}       [description]
	 * @api private
	 */
	function interpretRouteSyntax (route) {
		var target = route.target,
			path = route.path,
			verb = route.verb,
			options = route.options;

		if (_.isObject(target) && !_.isFunction(target) && !_.isArray(target)) {
		
			// Support { controller: 'FooController' } notation
			if (!_.isUndefined(target.controller)) {
				return bindController(path, target, verb);
			}

			// Support resourceful sub-mappings for verbless routes
			// e.g. '/someRoute': { post: 'FooController.bar', get: '...', /* ... */ }
			// If verb was manually specified in route (e.g. `get /someRoute`), ignore the sub-mappings
			if ( !options.detectedVerb ) {
				if ( target.get ) { sails.router.bind (path, target['get'],'get'); }
				if ( target.post ) { sails.router.bind (path, target['post'],'post'); }
				if ( target.put ) { sails.router.bind (path, target['put'],'put'); }
				if ( target['delete'] ) { sails.router.bind (path, target['delete'],'delete'); }
			}
		}

		// Support string ('FooController.bar') notation
		if (_.isString(target)) {

			// Handle dot notation
			var parsedTarget = target.match(/^([^.]+)\.?([^.]*)?$/);
			
			// If target matches a controller (or, if views hook enabled, a view)
			// go ahead and assume that this is a dot notation route
			var controllerId = util.normalizeControllerId(parsedTarget[1]);
			var actionId = _.isString(parsedTarget[2]) ? parsedTarget[2].toLowerCase() : 'index';

			// If this is a known controller, bind it
			if ( controllerId && (
				sails.middleware.controllers[controllerId] ||
				(sails.config.hooks.views.blueprints && sails.middleware.views[controllerId])
				)
			) {
				return bindController (path, {
					controller: controllerId,
					action: actionId
				}, verb);
			}
		}

		// Ignore unknown route syntax
		// If it needs to be understood by another hook, the hook would have also received
		// the typeUnknown event, so we're done.
		return;
	}



	/**
	 * Bind route to a controller/action.
	 * 
	 * @param  {[type]} path   [description]
	 * @param  {[type]} target [description]
	 * @param  {[type]} verb   [description]
	 * @return {[type]}        [description]
	 * @api private
	 */
	function bindController ( path, target, verb ) {

		// Normalize controller and action ids
		var controllerId = util.normalizeControllerId(target.controller);
		var actionId = _.isString(target.action) ? target.action.toLowerCase() : null;

		// Look up appropriate controller/action and make sure it exists
		var controller = sails.middleware.controllers[controllerId];

		// Fall back to matching view
		if (!controller) {
			controller = sails.middleware.views[controllerId];
		}

		// If a controller and/or action was specified, 
		// but it's not a match, warn the user
		if ( ! ( controller && _.isObject(controller) )) {
			sails.log.error(
				controllerId,
				':: Ignoring attempt to bind route (' + path + ') to unknown controller.'
			);
			return;
		}
		if ( actionId && !controller[actionId] ) {
			sails.log.error(
				controllerId + '.' + (actionId || 'index'),
				':: Ignoring attempt to bind route (' + path + ') to unknown controller.action.'
			);
			return;
		}


		// If unspecified, default actionId to 'index'
		actionId = actionId || 'index';

		// Bind the action subtarget
		var subTarget = controller[actionId];
		if (_.isArray(subTarget)) {
			_.each(subTarget, function bindEachMiddlewareInSubTarget (fn) {
				sails.router.bind(path, controllerHandler(fn), verb, target);
			});
			return;
		}
		
		// Bind a controller function to the destination route
		sails.router.bind(path, controllerHandler(subTarget), verb, target);


		// Wrap up the controller middleware to supply access to
		// the original target when requests comes in
		function controllerHandler (originalFn) {

			if ( !_.isFunction(originalFn) ) {
				sails.log.error(controllerId + '.' + actionId + ' :: ' +
					'Ignoring invalid attempt to bind route to a non-function controller:', 
					originalFn, 'for path: ', path, verb ? ('and verb: ' + verb) : '');
				return;
			}
			
			// Bind intercepted middleware function to route
			return function wrapperFn (req, res, next) {
				
				// Set target metadata
				req.target = {
					controller: controllerId,
					action: actionId || 'index'
				};
				
				// Call actual controller
				originalFn(req, res, next);
			};
		}

		return;
	}

};
