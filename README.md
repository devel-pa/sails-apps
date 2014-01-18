sails-apps
==========
Proof of concept

Experimental node module for sails v0.10 that provide modular MVC organization of the code.
Be very carefully with this code as sails changes very fast these days and as I'm comitting the code is already outdated.

to make it work with version SHA1 98188d3440b2610e6dc5920ef8894b1b9397b813:

0. add this node package to `packaje.json` ("sails-apps") from git and install it

1. in `app.js` replace `sails.lift();` with `require('sails-apps').lift(sails);`

2. in `api/blueprints` replace `var Model = sails.models[req.options.model];` with `var Model = (req.options.appId === "") ? sails.models[req.options.model] : sails.apps[req.options.appId].models[req.options.model];`

3. Good luck, you'll need it
