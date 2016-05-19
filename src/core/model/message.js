const Sequelize = require('sequelize');

function defineMessage(core, sequelize, User, Room) {

	// The fields
    let Message = sequelize.define('message', {
    	'content': {
    		'type': Sequelize.STRING(),
            'allowNull': false
    	}
    }, { 
        instanceMethods: {
            getUserRepresentation() {
                return {
                    'id': this.id,
                    'content': this.content,
                    'author': this.userId,
                    'room': this.roomId,
                    'timestamp': this.createdAt.getTime()
                };
            }
        }
    });

    // Relations

    // 1-to-many relationship between room and message
    // automagically adds the methods 
    //  - getMessages() and setMessages() to rooms.
    Room.hasMany(Message, {'as': 'Messages'});

    // many-to-one relationship between message and user
    Message.belongsTo(User);

    return Message;

}

module.exports.defineMessage = defineMessage;
