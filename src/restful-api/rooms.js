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

    // Check if member is provided
    if (members === undefined) {
        res.status(400).json({
            "errors": [{
                'field': 'members',
                'errorMessage': 'Members object has to be provided.'
            }]
        });
        return;
    }

    // Check if there are at minimum two members per room
    if (members.length < 2) {
        res.status(400).json({
            "errors": [{
                'field': 'members',
                'errorMessage': 'Members object must have at minimum two elements'
            }]
        });
        return;
    }

    // Check if authenticated member is also in the room
    if (members.findIndex(member => req.user.id === parseInt(member.id)) === -1) {
        res.status(401).json({
            "errors": [{
                'field': 'members',
                'errorMessage': 'Authorized user is not in members object'
            }]
        });
        return;
    }

    // Create room 
    let room = req.app.core.db.Room.build().save();

    // Add all new members to the room
    let userAdded = room.then(room => {
        return room.addUsers(members.map(member => member.id));
    });

    // Get the user representation
    let userRepresentation = Promise.all([room, userAdded]).then(arg => {
        let [room, _] = arg;
        return room.getUserRepresentation();
    });

    // Get the actual members
    let memberIds = members.map(m => parseInt(m.id));
    let memberObjs = req.app.core.db.User
        .findAll({'where': {'id': memberIds}});

    // Refresh the Websocket-Subscription lists
    let refreshed = Promise.all([memberObjs, userAdded])
        .then(arg => {
            let [memberObjects, _] = arg;
            return Promise.all(memberObjects.map(
                member => req.app.core.router.refreshUser(member)
            ));
        });
    
    // send the user representation to the client
    Promise.all([userRepresentation, refreshed])
        .then(arg => {
            let [representation, _] = arg;
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

    // Check if roomId is provided
    if (roomId === undefined) {
        res.status(400).json({
            "errors": [{
                'field': 'roomId',
                'errorMessage': 'Room id has to be provided.'
            }]
        });
        return;
    }

    // Find room
    let room = req.app.core.db.Room.findById(roomId);

    // Check if authenticated user is in the provided room
    let userIsInRoom = room
        .then(room => {
            return req.user.hasRoom(room);
        });

    // Remove member from room if he is there
    let removeUserFromRoom = Promise.all([room, userIsInRoom])
        .then(arg => {
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

    // Get the remaining members in the room.
    let getRemainingUsersInRoom = Promise.all([room, removeUserFromRoom])
        .then(arg => {
            let [room, _] = arg;
            return room.getUsers();
        });

    // Get the number of remaining members in the room
    let getNumberOfUsers = getRemainingUsersInRoom
        .then(users => {
            return users.length;
        });

    // Refresh the Websocket-Subscription lists
    let refreshed = getRemainingUsersInRoom
        .then(leftoverUsers => {
            let promises = leftoverUsers.map(
                u => req.app.core.router.refreshUser(u)
            );
            promises.push(req.app.core.router.refreshUser(req.user));
            return Promise.all(promises);
        });

    // Delete room if there are less then two members
    let deleteRoom = Promise.all([room, getNumberOfUsers])
        .then(arg => {
            let [room, count, _] = arg;
            if (count <= 1) {
                return room.destroy();
            }
        });

    // Send response or if there are errors send a error message
    Promise.all([deleteRoom, refreshed])
        .then(() => {
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
 * Returns all rooms of the authenticated user
 *
 * Returns on success:
 *  200 - A room object for the given username
 *
 */
router.get("/", (req, res) => {

    // Gets all rooms of the authenticated user
    req.user.getRooms().then(rooms => {

        // Object with all the room representations
        let room = [];
        let userRooms = [];

        // For each room of the user get the user representation and add them to the object
        rooms.forEach((item, i) => {
            userRooms.push(item.getUserRepresentation().then(represi => {
                room.push(represi);
            }));
        })

        // After all sent the object to the client
        Promise.all(userRooms).then(() => {
            res.json(room);
        })
        .catch(e => {
            res.status(500).json({
                field: "Unknown error",
                errorMessage: "Unknown error"
            });
        })
    });
});

module.exports = router;
