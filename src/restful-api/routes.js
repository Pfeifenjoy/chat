const express = require('express');

//subroutes
const users = require("./users");
const rooms = require("./rooms");


//Set up the Session and all the API-Routes 
function initialRoutes(core) {

    /**
     * Middleware function that forces authentication
     */
    function auth(req, res, next){
        
        // urls that don't need authentification
        const ignoreUrls = [
            {'url': '/users'        , 'method': 'POST'},
            {'url': '/users/login'  , 'method': 'POST'}
        ];

        // is authentication needed for this url?
        let ignore = ignoreUrls
            .map(ignore => ignore.url = req.url && ignore.method == req.method)
            .reduce((a, b) => a || b);

        if (ignore){
            next();
            return;
        }

        // get the token
        let token = req.body.token || req.query.token;

        // check the token
        core.checkWebToken(token)
            .then(user => {
                req.user = user;
                next();
            })
            .catch(err => {
                res.status(401).json({
                    'errors': [
                        {
                            'errorMessage': 'You are unauthorized. Please log in to complete the request.'
                        }
                    ]
                });
            });
    }

    // create router
    let router = new express.Router;

    // configure authentication
    router.use(auth);

    // add the routes
    router.use("/users", users);
    router.use("/rooms", rooms);
    
    return router;
}

module.exports.initialRoutes = initialRoutes;
