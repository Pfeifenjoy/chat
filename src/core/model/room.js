const Sequelize = require('sequelize');

function defineRoom(core, sequelize, User) {

    // The fields
    let Room = sequelize.define('room', {
        /* A room has no fields, just relations to other tables  */
    }, { 
        instanceMethods: {
            getUserRepresentation() {
                let members = this.getUsers();
                let messages = this.getMessages();
                let userRepresentation = Promise.all([members, messages])
                    .then(arg => {
                        let [members, messages] = arg;
                        let memberUsrRepr = members.map(m => m.getUserRepresentation());
                        let messagesUsrRepr = messages.map(m => m.getUserRepresentation());
                        return {
                            'id': this.id,
                            'members': memberUsrRepr,
                            'messages': messagesUsrRepr
                        };
                    });
                return userRepresentation;
            }
        }
    });

    // The relations

    // n-to-m relation between user and room
    // automagically adds the methods
    //  - getRooms() and setRooms() to the Users
    //  - getUsers() and setUsers() to the Rooms
    Room.belongsToMany(User, {'through': 'UserInRoom'});
    User.belongsToMany(Room, {'through': 'UserInRoom'});

    return Room;

}

module.exports.defineRoom = defineRoom;
