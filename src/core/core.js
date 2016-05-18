const db = require('./db.js');
const MessageRouter = require('./../websockets/routing.js').MessageRouter;
const jwt = require('jsonwebtoken');

class Core {

	constructor(config) {
		this.config = config;
		this.db = db.connect(this);
		this.router = new MessageRouter(this);
	}

	/**
	 * Initializes all the async stuff. 
	 * Returns a promise.
	 */
	init() {
		// sync the database
		return this.db.sequelize.sync();
	}

	/**
	 * Checks the given web token. If it is valid, fetches the 
	 * corresponding user from the database.
	 * 
	 * @param  {string}
	 * @return {Promise}
	 */
	checkWebToken(token){
		let secret = this.config.session.secret;

		// verify the token
		let verify = new Promise((accept, reject) => {
			jwt.verify(token, secret, function(err, decode) {
				if (err) {
					reject(err);
				} else {
					accept(decode);
				}
			});
		});
		
		// get the logged in user from the database.
		let user = verify
			.then(decode => {
				return this.db.User.findById(decode.id);
			});

		let result = Promise.all([verify, user])
			.then(args => {
				let [token, user] = args;
				if (user) {
					user.expires = token.exp * 1000;
					return user;
				} else {
					throw "Unknown user";
				}
			})
			.catch(e => {
				console.log('Login failed:', e);
				throw e;
			});

		return result;
	}
}

module.exports.Core = Core;