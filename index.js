var _			= require('lodash')

module.exports.lift = function (sails, configOverride, cb) {
    var overrides = {};
    overrides.hooks = {};
    overrides.hooks.moduleloader = require('./hooks/moduleloader');
    overrides.hooks.controllers = require('./hooks/controllers');
    overrides.hooks.blueprints = require('./hooks/blueprints');
    overrides.hooks.orm = require('./hooks/orm');

    _.merge(overrides, configOverride || {});

    sails.lift(overrides);

}