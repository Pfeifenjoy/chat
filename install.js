#!/usr/bin/env node

var exec = require("child_process").exec;

console.log("Starting setup.")

function handleError(errMessage) {
    console.error(errMessage);
    console.error("This is bad. Recheck the dependencies and try again.");
    process.exit(1);
}


function buildFrontend(callback) {
    console.log("Starting to compile the frontend.");
    exec("npm run build-production", function(err, stdout, stderr) {
        if(err) {
            handleError("Could not compile the frontend: " + stderr);
        }
        console.log("Finished compiling the frontend");
        if(callback) callback();
    })
}

function installFrontend(callback) {
    console.log("Starting to install frontend dependencies.");
    exec("npm install", function(err, stdout, stderr) {
        if(err) {
            handleError("The frontend dependencies could not be installed: " + stderr);
        }
        console.log("Installed frontend dependencies.");
        buildFrontend(callback);
    })
}


var lastPath = process.cwd();
process.chdir(__dirname + "/files/chat-frontend");
installFrontend(function() {
    process.chdir(lastPath);
    console.log("Everything done.");
});
