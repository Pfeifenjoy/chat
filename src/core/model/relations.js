const Sequelize = require('sequelize');

function defineRoom(sequelize) {

    let Room = sequelize.define('room', {});

    return Room;

}

module.exports.defineRoom = defineRoom;