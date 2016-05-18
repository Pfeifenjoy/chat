const express = require("express");
const router = new express.Router;

router.post("/", (req, res) => {
    let errors = [];

    let {
        members
    } = req.body;

    let room = req.app.core.db.Room.build()

    room.setUsers(members)

    room.save()
    .then(room => {
        res.json(room.getUserRepresentation())
    })
    .catch(e => {
        //TODO check the type of the error. and add them to errors
        res.status(500).json({
            errors
        })
    })
});

module.exports = router;
