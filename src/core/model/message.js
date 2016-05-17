const Sequelize = require('sequelize');

function defineMessage(sequelize, User, Room) {

	// The fields
    let Message = sequelize.define('message', {
    	'content': {
    		'type': Sequelize.STRING()
    	}
    });

    // Relations

    // 1-to-many relationship between room and message
    // automagically adds the methods 
    //  - getMessages() and setMessages() to rooms.
    Room.hasMany(Message, {'as': 'Messages'});		// automacically adds getMessages / setMessages to rooms.

    // many-to-one relationship between message and user
    Message.belongsTo(User);

    return Message;

}

module.exports.defineMessage = defineMessage;
