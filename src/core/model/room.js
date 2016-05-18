const Sequelize = require('sequelize');

function defineRoom(core, sequelize, User) {

    // The fields
    let Room = sequelize.define('room', {
        /* A room has no fields, just relations to other tables  */
    }, { 
        instanceMethods: {
            getUserRepresentation() {
                return this.getUsers()
                .then(members => members.map(member => member.getUserRepresentation()))
                .then(members => {
                    return {
                        "id": this.id,
                        members
                    }
                })
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
