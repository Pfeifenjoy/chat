const express = require('express');

//subroutes
const users = require('./users');


//Set up the Session and all the API-Routes 
function initialRoutes(core) {

    /**
     * Middleware function that forces authentication
     */
    function auth(req, res, next){
        
        // urls that don't need authentification
        const ignoreUrls = [
            '/users',
            '/users/login'
        ];

        // is authentication needed for this url?
        if (ignoreUrls.indexOf(req.url) != -1){
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
    /*let authenticationMiddleware = expressJwt({
            'secret': core.config.session.secret}
        ).unless({ path: [
            {'url': apiBaseUrl + '/users'      , methods: ['POST']},
            {'url': apiBaseUrl + '/users/login', methods: ['POST']}
        ]});

    router.use(authenticationMiddleware);
*/
    router.use(auth);

    // add the routes
    router.use('/users', users);
    
    return router;
}

module.exports.initialRoutes = initialRoutes;