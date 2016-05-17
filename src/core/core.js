const db = require('./db.js');

class Core {

	constructor(config) {
		this.config = config;
		this.db = db.connect(this);
	}

	/**
	 * Initializes all the async stuff. 
	 * Returns a promise.
	 */
	init(){
		// sync the database
		return this.db.sequelize.sync();
	}
}

module.exports.Core = Core;