const loadJsonFile  = require('./utils/load-json.js').loadJsonFile;
const Core          = require('./core/core').Core;
const express       = require('express');
const bodyParser    = require('body-parser');
const routes        = require('./restful-api/routes');
const websockets    = require('./websockets/server.js');
const path          = require("path");

// read the configuration
const configFile = './files/config/chat-config.json';
const config     = loadJsonFile(configFile);

// initialize express.js
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// RESTful api
const apiEnabled = config.http.api.enabled || true;
const apiBaseUrl = config.http.api.baseUrl || '/api/v1';
const port = config.http.port || 3001;

// create a core
const core = new Core(config);

core.init()
    .then(() => {
        // Start Websockets server 
        websockets.startServer(core);

        // Start the server
        app.core = core;
        if (apiEnabled) {
            // add all routes
            app.use(apiBaseUrl, routes.initialRoutes(core));
        }

        // static files delivery
        app.use("/build", express.static(path.resolve(__dirname + "/../files/frontend/build/")));

        app.get("*", (req, res) => {
            res.sendFile(path.resolve(__dirname + "/../files/frontend/index.html"));
        })

        // Handle routes which don't exist
        app.use((req, res, next) => {
            res.status(404).send("Nothing found.")
        });

        // Catch errors
        app.use((err, req, res, next) => {
            console.error(err);
            res.status(500).send("Something went wrong");
        });
        return app.listen(port);
    })
    .then(function() {
        console.log(`Server is listening at port ${port}.`);
    })
    .catch(function(err) {
        console.error("Something went wrong, could not start the server:");
        console.error(err);
        process.exit(1);
    });
