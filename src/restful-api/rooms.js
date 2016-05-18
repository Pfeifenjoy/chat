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
    console.log(members);

    if (members === undefined) {
        res.status(400).json({
            "errors": [{
                'field': 'members',
                'errorMessage': 'Members object has to be provided.'
            }]
        });
        return;
    }

    if (!req.user.getUserRepresentation() in members) {
        res.status(401).json({
            "errors": [{
                'field': 'members',
                'errorMessage': 'Authorized user is not in members object'
            }]
        });
        return;
    }

    let room = req.app.core.db.Room.build();

    room.setUsers(members.map(member => member.id));

    room.save()
        .then(room => room.getUserRepresentation())
        .then(room => {
            res.json(room);
        })
        .catch(e => {
            res.status(400).json({
                "errors": [{
                    'field': 'members',
                    'errorMessage': 'Not all given members are existing in database.'
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

module.exports = router;