const WebSocketServer = require('ws').Server

class Connection{
	
	constructor(core, client) {

		// init
		this.core = core;
		this.client = client;
		this.authenticated = false;
		this.expires = 0;
		this.user = null;
		this.subscriptionid = 0;
		this.authenticating = false;

		// register events
		this.client.on('message', this.onMessage.bind(this));
		this.client.on('close', this.onClose.bind(this));

		// log
		console.log('ws: Client connected.');
	}

	//---- Authentication ------------------------------------------------------------------------

	/**
	 * Returns a boolean indicating, whether
	 * the given message type may be handeled.
	 */
	isAuthenticated(){
		return authenticated && expires > Date.now();
	}

	/**
	 * Sets the authenticated user
	 */
	setAuthenticated(user, expires) {
		// do not authenticate multiple times at once
		if (this.authenticating) {
			return Promise.reject();
		}
		this.authenticating = true;
		
		// unauthenticate the old authenticated user
		if (this.authenticated) {
			this.unAuthenticate();
		}

		// register at the WsRouter
		let registered = this.core.router.registerUser(user, this.onMessageFromRouter.bind(this));

		// finalize
		return registered
			.then(subscriptionid => {
				this.subscriptionid = subscriptionid;
				this.user = user;
				this.expires = expires;
				this.authenticated = true;
				this.authenticating = false;
			})
			.error(e => {
				this.authenticating = false;
				throw e;
			});
	}

	/**
	 * resets the authenticated user.
	 */
	unAuthenticate() {
		if (this.authenticated) {
			this.authenticated = false;
			this.core.router.unregisterUser(this.user, this.subscriptionid);
		}
	}

	/**
	 * processes an AUTHENTICATE message.
	 */
	processAuthentication(token, transactionid) {
		this.core.checkWebToken(token)
			.then(user => {
				// token is ok
				this.setAuthenticated(user, user.expires)
					.then(() => {
						this.sendWelcome(transactionid);
						console.log('ws: Authentication: successful as: ', user.username);
					})
					.catch(e => {
						this.sendError(transactionid);
						this.unAuthenticate();
					});
				
			})
			.catch(err => {
				// auth failed
				this.sendUnauthenticated(transactionid);
				this.unAuthenticate();
				console.log('ws: Authentication: failed for token: ', token);
				console.log(err);
			});
	}

	//---- Message Handling ----------------------------------------------------------------------

	/**
	 * Processes a message
	 */
	processMessage(type, payload, transactionid){
		this.sendError(transactionid, 'unsupported_message_type');
	}

	//---- Events --------------------------------------------------------------------------------

	/**
	 * Gets called when the router wants to
	 * send a message over this connection.
	 */
	onMessageFromRouter() {

	}

	/**
	 * Gets called when something arrives at the websocket.
	 */
	onMessage(text, flags){
		let transactionid;

		try {

			// parse the message
			if (flags.binary) return;
			console.log('ws: Received message: ', text);
			let message = JSON.parse(text);
			let type = message.type || '';
			let payload = message.payload || {};
			transactionid = message.transactionid || -1;

			// authenticate
			if (type === 'AUTHENTICATE') {
				let token = payload.token;
				this.processAuthentication(token, transactionid);
				return;
			}

			// check authentication for all other messages
			if (!this.isAuthenticated()) {
				this.sendUnauthenticated(transactionid);
				console.log('ws: Access denied.');
				return;
			}

			// handle the message
			this.processMessage(type, payload, transactionid);

		} catch (e) {
			this.sendError(transactionid);
			console.log('ws: Unexpected error:');
			console.log(e);
		}
	}

	/**
	 * Gets called, when the connection closes.
	 */
	onClose(){
		this.unAuthenticate();
		console.log('ws: Connection closed.');
	}


	//---- Sending -------------------------------------------------------------------------------

	/**
	 * Sends a message
	 */
	sendMessage(type, payload = {}) {
		let message = JSON.stringify({
			'type': type,
			'payload': payload
		});
		this.client.send(message);
	}

	/**
	 * Sends an ERROR message.
	 */
	sendError(transactionid=undefined, type='unknown') {
		this.sendMessage('ERROR', {
			'type': type, 
			'transactionid': transactionid
		});
	}

	/**
	 * Sends an UNAUTHENTICATED message.
	 */
	sendUnauthenticated(transactionid) {
		this.sendMessage('UNAUTHENTICATED', {
			'transactionid': transactionid
		});
	}

	/**
	 * Sends a WELCOME message.
	 */
	sendWelcome(transactionid) {
		this.sendMessage('WELCOME', {
			'transactionid': transactionid
		});
	}
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
		let connection = new Connection(core, client);
	}
	wss.on('connection', onConnection);

	return wss;
}



module.exports.startServer = startServer;