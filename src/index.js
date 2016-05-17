const loadJsonFile = require('./utils/load-json.js').loadJsonFile;
const Core 		   = require('./core/core').Core;
const express 	   = require('express');

// read the configuration
const configFile = './files/config/chat-config.json';
const config = loadJsonFile(configFile);

// initialize express.js
var app = express();

// create a core
const core = new Core(config);

core.init()
	.then(() => {
		console.log('ok');
		// add routes to use.
	});