const express = require('express');

//subroutes
const users = require('./user');


//Set up the Session and all the API-Routes 
function initialRoutes(core) {
    // create router
    let router = new express.Router;

    // add the routes
    router.use('/users', users);
    
    return router;
}

module.exports.initialRoutes = initialRoutes;