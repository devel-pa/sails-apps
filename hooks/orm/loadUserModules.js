module.exports = function(sails) {


	/**
	 * Module dependencies.
	 */

	var util = require('sails-util'),
    _ = require('lodash'),
		async = require('async');


	return function (cb) {

		/**
		 * Expose Hook definition
		 */

		sails.log.verbose('Loading the app\'s models and adapters...');
		async.auto({

			models: function(cb) {
				sails.log.verbose('Loading app models...');

				sails.models = {};

				// Load app's model definitions
				// Case-insensitive, using filename to determine identity
				sails.modules.loadModels(sails.config.paths.models, function modulesLoaded (err, modules) {
					if (err) return cb(err);
					sails.models = modules;

          var appsPath = sails.config.appPath + '/apps';
          sails.modules.statApps(appsPath, function appsLoaded(err, apps){
            sails.apps = sails.apps || {};
            _.each(apps, function(app, key) {
              sails.apps[key] = sails.apps[key] || {};
              if(_.has(app, 'models')) {
                sails.modules.loadModels(appsPath + '/' + key + '/models', function modulesLoaded (error, submodules) {
                  if (err) return cb(error);
                  sails.apps[key].models = submodules;
                });
              }
            });
          });

					return cb();
				});
			},

			adapters: function (cb) {
				sails.log.verbose('Loading app adapters...');

				sails.adapters = {};

				// Load custom adapters
				// Case-insensitive, using filename to determine identity
				sails.modules.loadAdapters(function modulesLoaded (err, modules) {
					if (err) return cb(err);
					sails.adapters = modules;
					return cb();
				});
			}

		}, cb);
	};

};
