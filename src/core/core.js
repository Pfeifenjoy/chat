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
	init() {
		// sync the database
		return this.db.sequelize.sync();
	}

	hashPassword(password) {
		let salt = crypto
			.randomBytes(32)
			.toString('hex');
		let hash = crypto
			.createHash('md5')
			.update(password + salt)
			.digest('hex');
		return {
			passwordSalt: salt,
			passwordHash: hash
		};
	}


	// User Management functions
	createUser(username, password, email) {
		let hashedPassword = this.hashPassword(password);
		return this.db.User.create({
			username: username,
			passwordSalt: hashedPassword.salt,
			passwordHash: hashedPassword.hash,
			email: email
		});
	}
}

module.exports.Core = Core;