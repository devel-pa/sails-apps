module.exports = function(sails) {


	/**
	 * Module dependencies
	 */

	var util =	require('sails-util'),
		buildDictionary = require('./buildDictionary'),
		async = require('async');


	// TODO:
	// Look at improving `includeAll` to work asynchronously
	// CommonJS `require` is a blocking operation, and makes apps
	// start slower.



	/**
	 * Module loader
	 *
	 * Load a module into memory
	 */
	return {


		// Default configuration
		defaults: function (config) {
			return {

				// The path to the application
				appPath: config.appPath || process.cwd(),

				// Paths for application modules and key files
				// If `paths.app` not specified, use process.cwd()
				// (the directory where this Sails process is being initiated from)
				paths: {

					// Configuration
					// 
					// For `userconfig` hook
					config: config.appPath + '/config',

					// Server-Side Code
					// 
					// For `controllers` hook
					controllers: config.appPath + '/api/controllers',
					// For `policies` hook
					policies: config.appPath + '/api/policies',
					// For `services` hook
					services: config.appPath + '/api/services',
					// For `orm` hook
					adapters: config.appPath + '/api/adapters',
					models: config.appPath + '/api/models',
					// For `userhooks` hook
					hooks: config.appPath + '/api/hooks',
					// For `blueprints` hook
					blueprints: config.appPath + '/api/blueprints',
					// For `responses` hook
					responses: config.appPath + '/api/responses',

					// Server-Side HTML
					// 
					// For `views` hook
					views: config.appPath + '/views',
					layout: config.appPath + '/views/layout.ejs',
				}
			};
		},

		
		initialize: function(cb) {

			// Expose self as `sails.modules` (for backwards compatibility)
			sails.modules = sails.hooks.moduleloader;

			return cb();
		},



		/**
		 * Load user config from app
		 *
		 * @param {Object} options
		 * @param {Function} cb
		 */
		loadUserConfig: function (cb) {
			
			async.auto({

				'config/*': function loadOtherConfigFiles (cb) {
					sails.modules.aggregate({
						dirname		: sails.config.appPath + '/config',
						exclude		: ['locales', 'local.js', 'local.coffee'],
						excludeDirs: ['locales'],
						filter		: /(.+)\.(js|coffee)$/,
						identity	: false
					}, cb);
				},

				
				'config/local' : function loadLocalOverrideFile (cb) {
					sails.modules.aggregate({
						dirname		: sails.config.appPath + '/config',
						filter		: /local\.(js|coffee)$/,
						identity	: false
					}, cb);
				}

			}, function (err, async_data) {
				if (err) return cb(err);

				// `local.js` overrides the other user config files.
				cb(null, util.merge(
					async_data['config/*'],
					async_data['config/local']
				));
			});
		},



		/**
		 * Load app controllers
		 *
		 * @param {Object} options
		 * @param {Function} cb
		 */
		loadControllers: function (path, cb) {
			sails.modules.optional({
				dirname: path,
				filter: /(.+)Controller\.(js|coffee)$/,
				markDirectories: true,
				replaceExpr: /Controller/
			}, cb);
		},




		/**
		 * Load adapters
		 *
		 * @param {Object} options
		 * @param {Function} cb
		 */
		loadAdapters: function (cb) {
			sails.modules.optional({
				dirname		: sails.config.paths.adapters,
				filter		: /(.+Adapter)\.(js|coffee)$/,
				replaceExpr	: /Adapter/
			}, cb);
		},




		/**
		 * Load app's model definitions
		 *
		 * @param {Object} options
		 * @param {Function} cb
		 */
		loadModels: function (path, cb) {
			sails.modules.optional({
				dirname		: path,
				filter		: /(.+)\.(js|coffee)$/
			}, cb);
		},





		/**
		 * Load app services
		 *
		 * @param {Object} options
		 * @param {Function} cb
		 */
		loadServices: function (cb) {
			sails.modules.optional({
				dirname			: sails.config.paths.services,
				filter			: /(.+)\.(js|coffee)$/,
				depth			: 1,
				caseSensitive	: true
			}, cb);
		},



		/**
		 * Check for the existence of views in the app
		 *
		 * @param {Object} options
		 * @param {Function} cb
		 */
      //path,
		statViews: function ( cb) {
      var path = sails.config.paths.views;//to be removed later
			sails.modules.optional({
				dirname: path,
				filter: /(.+)\..+$/,
				replaceExpr: null,
				dontLoad: true
			}, cb);
		},

    statApps: function(path, cb) {
      sails.modules.optional({
        dirname: path,
//        filter: /(.+)\..+$/,
        markDirectories: true,
        replaceExpr: null,
        dontLoad: true,
//        useGlobalIdForKeyName: true
//        ,
//        depth: 2
      }, cb);
    },



		/**
		 * Load app policies
		 *
		 * @param {Object} options
		 * @param {Function} cb
		 */
		loadPolicies: function (cb) {
			sails.modules.optional({
				dirname: sails.config.paths.policies,
				filter: /(.+)\.(js|coffee)$/,
				replaceExpr: null
			}, cb);
		},



		/**
		 * Load app hooks
		 *
		 * @param {Object} options
		 * @param {Function} cb
		 */
		loadUserHooks: function (cb) {
			sails.modules.optional({
				dirname: sails.config.paths.hooks,
				filter: /^(.+)\.(js|coffee)$/,

				// Hooks should be defined as either single files as a function
				// OR (better yet) a subfolder with an index.js file
				// (like a standard node module)
				depth: 2
			}, cb);
		},



		/**
		 * Load app blueprint middleware.
		 *
		 * @param {Object} options
		 * @param {Function} cb
		 */
		loadBlueprints: function (cb) {
			sails.modules.optional({
				dirname: sails.config.paths.blueprints,
				filter: /(.+)\.(js|coffee)$/,
				useGlobalIdForKeyName: true
			}, cb);
		},



		/**
		 * Load custom API responses.
		 *
		 * @param {Object} options
		 * @param {Function} cb
		 */
		loadResponses: function (cb) {
			sails.modules.optional({
				dirname: sails.config.paths.responses,
				filter: /(.+)\.(js|coffee)$/,
				useGlobalIdForKeyName: true
			}, cb);
		},




		/**
		 * Build a dictionary of named modules
		 * (responds with an error if the container cannot be loaded)
		 *
		 * @param {Object} options
		 * @param {Function} cb
		 */

		required: function(options, cb) {
			return buildDictionary(options, cb);
		},


		/**
		 * Build a dictionary of named modules
		 * (fails silently-- returns {} if the container cannot be loaded)
		 *
		 * @param {Object} options
		 * @param {Function} cb
		 */

		optional: function(options, cb) {
			options.optional = true;
			return buildDictionary(options, cb);
		},


		/**
		 * Build a dictionary indicating whether the matched modules exist
		 * (fails silently-- returns {} if the container cannot be loaded)
		 *
		 * @param {Object} options
		 * @param {Function} cb
		 */

		exists: function(options, cb) {
			options.optional = true;
			options.dontLoad = false;
			return buildDictionary(options, cb);
		},


		/**
		 * Build a single module object by extending {} with the contents of each module
		 * (fail silently-- returns {} if the container cannot be loaded)
		 *
		 * @param {Object} options
		 * @param {Function} cb
		 */

		aggregate: function(options, cb) {
			options.aggregate = true;
			options.optional = true;
			return buildDictionary(options, cb);
		}
	};

};