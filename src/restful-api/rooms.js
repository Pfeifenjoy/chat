const express = require("express");
const router = new express.Router;

/**
 * Creates a room
 *
 * Expected parameters:
 * members
 *
 * Returns on success:
 *  200 - A room object
 *
 * Returns on failure:
 * 401 - authorized user is not in members object.
 * 400 - Not all given members are existing in database.
 */
router.post("/", (req, res) => {
    let {
        members
    } = req.body;

    if (members === undefined) {
        res.status(400).json({
            "errors": [{
                'field': 'members',
                'errorMessage': 'Members object has to be provided.'
            }]
        });
        return;
    }

    if (members.length < 2) {
        res.status(400).json({
            "errors": [{
                'field': 'members',
                'errorMessage': 'Members object must have at minimum two elements'
            }]
        });
        return;
    }

    if (members.findIndex(member => req.user.id === parseInt(member.id)) === -1) {
        res.status(401).json({
            "errors": [{
                'field': 'members',
                'errorMessage': 'Authorized user is not in members object'
            }]
        });
        return;
    }

    let room = req.app.core.db.Room.build().save();

    let userAdded = room.then(room => {
        return room.addUsers(members.map(member => member.id));
    });

    let userRepresentation = Promise.all([room, userAdded]).then(arg => {
        let [room, _] = arg;
        return room.getUserRepresentation();
    });

    userRepresentation.then(representation => {
            res.json(representation);
        })
        .catch(e => {
            console.log(e);
            res.status(400).json({
                "errors": [{
                    'field': 'members',
                    'errorMessage': 'One of the given members is not known.'
                }]
            });
        });
});

/**
 * Deletes a user from a room
 *
 * Expected parameters:
 *  roomId
 *
 * Returns on success:
 *  200 - User could leave the room.
 *
 * Returns on failure:
 *  400 - User does not exist in this room.
 *  400 - Room id has to be provided.
 *  500 - Unexpected error.
 */
router.put("/exit", (req, res) => {
    let {
        roomId
    } = req.body;

    if (roomId === undefined) {
        res.status(400).json({
            "errors": [{
                'field': 'roomId',
                'errorMessage': 'Room id has to be provided.'
            }]
        });
        return;
    }

    let room = req.app.core.db.Room.findById(roomId);

    let userIsInRoom = room.then(room => {
        return req.user.hasRoom(room);
    });

    let removeUserFromRoom = Promise.all([room, userIsInRoom]).then(arg => {
        let [room, userIsInRoom] = arg;
        if (userIsInRoom) {
            return room.removeUser(req.user).then(() => {

            }).catch(error => {
                res.status(500).json({
                    "errors": [{
                        'field': 'unexpected',
                        'errorMessage': 'Unexpected error.'
                    }]
                });
            });
        }
    });

    let getNumberOfUsers = Promise.all([room, removeUserFromRoom]).then(arg => {
        let [room, _] = arg;
        return room.countUsers();
    });

    let deleteRoom = Promise.all([room, getNumberOfUsers]).then(arg => {
        let [room, count] = arg;
        if (count <= 1) {
            return room.destroy();
        }
    });

    deleteRoom.then(() => {
        res.send("Left room.");
    }).catch(error => {
        console.log(error);
        res.status(400).json({
            "errors": [{
                'field': 'roomId',
                'errorMessage': 'User does not exist in this room.'
            }]
        });
    });
});

/**
 * Returns all rooms of a user
 *
 * Returns on success:
 *  200 - A room object for the given username
 *
 */
router.get("/", (req, res) => {

    req.user.getRooms().then(rooms => {

        let sync = Promise.resolve();

        let room = [];
        rooms.forEach(item => {
            sync = item.getUserRepresentation().then(represi => {
                room.push(represi);
            });
        })

        sync.then(() => {
            res.json(room);
        });
    });
});

module.exports = router;
