const express = require('express');
var expressJwt = require('express-jwt');

//subroutes
const users = require('./users');

let authenticationMiddleware; 

//Set up the Session and all the API-Routes 
function initialRoutes(core) {
    // create router
    let router = new express.Router;

    authenticationMiddleware = expressJwt({secret: core.config.session.secret});

    // Init Middleware
    users.initUsers(authenticationMiddleware);

    // add the routes
    router.use('/users', users);
    
    return router;
}

module.exports.initialRoutes = initialRoutes;