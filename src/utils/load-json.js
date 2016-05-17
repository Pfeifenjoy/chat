const fs = require('fs');

function loadJsonFile(filename) {
	var fileContents = fs.readFileSync(filename, 'utf8');
	return JSON.parse(fileContents);
}

module.exports.loadJsonFile = loadJsonFile;