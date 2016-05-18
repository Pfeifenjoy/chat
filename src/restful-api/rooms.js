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

    members = JSON.parse(members)["members"];

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
                'errorMessage': 'Members obeject must have at minimum two elements'
            }]
        });
        return;
    }

    if (members.findIndex(member => req.user.id === member.id) === -1) {
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
 * Update a room
 *
 * Expected parameters:
 *  room
 *
 * Returns on success:
 *  200 - A updated room object
 *
 * Returns on failure:
 *  401 - authorized user is not in members object.
 *  500 - Unexpected error
 */
router.put("/", (req, res) => {
    let {
        room
    } = req.body;

    if (!req.user.getUserRepresentation() in members) {
        res.status(401).json({
            "errors": [{
                'field': 'unauthorized',
                'errorMessage': 'Authorized user is not in members object'
            }]
        });
    }

});

/**
 * Returns all rooms of a user
 *
 * Expected parameters:
 *  user
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
        })


    });
});

module.exports = router;