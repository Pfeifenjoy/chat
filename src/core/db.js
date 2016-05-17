const Sequelize 	= require('sequelize');
const usermodel		= require('./model/user.js'); 
const roommodel		= require('./model/room.js'); 
const messagemodel	= require('./model/message.js'); 

/**
 * Connects to the database.
 * Returns a promise that gets accepted once the connection 
 * is established.
 */
function connect(core) {

	// get the connection options

	const defaultOptions = {
		'dialect': 'sqlite',
		'storage': 'db.sqlite'
	};

	let db 		= core.config.database.db || '';
	let user 	= core.config.database.user || '';
	let pass 	= core.config.database.password || '';
	let options	= core.config.database.options || defaultOptions;

	// init sequelize

	let sequelize = new Sequelize(db, user, pass, options);

	// define the models 
	
	let User 	= usermodel.defineUser(core, sequelize);
	let Room 	= roommodel.defineRoom(core, sequelize, User);
	let Message	= messagemodel.defineMessage(core, sequelize, User, Room);

	return {
		'sequelize': sequelize,
		'User': User,
		'Room': Room
	};
}

module.exports.connect = connect;