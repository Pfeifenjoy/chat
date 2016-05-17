const loadJsonFile 	= require('./utils/load-json.js').loadJsonFile;
const Core 			= require('./core/core').Core;

// read the configuration
const configFile = './files/config/chat-config.json';
const config = loadJsonFile(configFile);

// create a core
const core = new Core(config);

core.init()
	.then(() => {
		console.log('ok');
	});

