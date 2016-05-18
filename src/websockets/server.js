const WebSocketServer = require('ws').Server

/**
 * Assembles a message out of a type and a payload.
 */
function makeMessage(type, payload = {}) {
	return JSON.stringify({
		'type': type,
		'payload': payload
	});
}

/**
 * Starts the websocket server
 */
function startServer(core) {

	// read the settings
	const port = core.config.websocket.port || 8080;

	// start the WebSockets Server
	const wss = new WebSocketServer({
		'port': port
	}, function(){
		console.log('Websocket server is running. Listening on port ' + port + '.');
	});

	// when a user connects...
	function onConnection(client){
		let authenticated = false;
		let expires = 0;
		let user = null;

		console.log('ws: Client connected.');

		// when a message from the user arrives...
		client.on('message', function(text, flags) {

			try {

				// parse the message
				if (flags.binary) return;
				let message = JSON.parse(text);
				let type = message.type || '';
				let payload = message.payload || {};
				console.log('ws: Received message: ', text);

				// authenticate the user if requested
				if (type === 'AUTHENTICATE') {
					let token = payload.token;
					core.checkWebToken(token)
						.then(newUser => {

							// auth successful
							authenticated = true;
							expires = newUser.expires;
							user = newUser;
							client.send(makeMessage('WELCOME'));
							console.log('ws: Authentication: successful as: ', user.username);

						})
						.catch(err => {

							// auth failed
							client.send(makeMessage('UNAUTHENTICATED'));
							authenticated = false;
							console.log('ws: Authentication: failed for token: ', token);
						});
					return;
				}

				// for all other messages apart from 'AUTHENTICATE', authentication is needed. so...

				// check authentication
				if (!authenticated || expires < Date.now()) {
					client.send(makeMessage('UNAUTHENTICATED'));
					console.log('ws: Authentication: Access denied.');
					return;
				}

				// handle the request
				client.send(makeMessage('ERROR', {'type': 'unsupported_message_type'}));

			} catch (e) {
				client.send(makeMessage('ERROR', {'type': 'unknown'}));
				console.log('ws: Unexpected error:');
				console.log(e);
			}

		});

		client.on('close', function(){
			console.log('ws: Connection closed.');
		});
	}
	wss.on('connection', onConnection);

	return wss;
}



module.exports.startServer = startServer;