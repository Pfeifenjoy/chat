

class MessageRouter {

	constructor(core) {
		this._core = core;
		this._users = {};
		this._rooms = {};
		this._uniqueNumber = 0;
	}

	/**
	 * Adds a user to a room subscription.
	 */
	_addUserToRoom(userId, room) {
		let roomId = String(room.id);

		// add the room if it does not exist jet
		if (this._rooms[roomId] === undefined) {
			this._rooms[roomId] = {
				'obj'	: room,
				'users'	: []
			};
		}

		// add the user to the room
		this._rooms[roomId].users.push(userId);

		// add the room to the user
		this._users[userId].rooms.push(roomId);
	}

	/**
	 * Removes a user from a room subscription.
	 */
	_removeUserFromRoom(userId, roomId) {

		// remove the user from the room
		let userPos = this._rooms[roomId].users.indexOf(userId);
		if (userPos >= 0) {
			this._rooms[roomId].users.splice(userPos, 1);
		}

		// remove the room if it is empty
		if (this._rooms[roomId].users.length == 0) {
			delete this._rooms[roomId];
		}

		// remove the room from the user
		let roomPos = this._users[userId].rooms.indexOf(roomId);
		if (roomPos >= 0) {
			this._users[userId].rooms.splice(roomPos, 1);
		}
	}

	/**
	 * Remove the user from all room subscriptions.
	 */
	_removeUserFromAllRooms(userId) {
		for (let roomId of this._users[userId].rooms) {
			this._removeUserFromRoom(userId, roomId);
		}
	}

	/**
	 * Registers a connection to a user at the MessageRouter.
	 * user 	: The user object.
	 * fn 		: A callback function to call when a message for the user arrives.
	 * returns 	: A promise for a connection ID. It is needed later to unsubscribe again.
	 */
	registerUser(user, fn) {
		let userId = String(user.id);
		let connectionId = String(this._uniqueNumber);
		this._uniqueNumber = this._uniqueNumber + 1;

		// add the user if it does not exist jet.
		if (this._users[userId] === undefined) {
			this._users[userId] = {
				'obj'	: user,
				'rooms'	: [],
				'connections': {}
			};
		}

		// Add the callback to the connections
		this._users[userId].connections[connectionId] = fn;

		// load the user's rooms
		let refreshed = this.refreshUser(user);

		// return the connectionId.
		return refreshed.then(() => {
			return connectionId;
		});
	}

	/**
	 * Unregisters a connection to a user at the MessageRouter
	 */
	unregisterUser(user, connectionId){
		let userId = String(user.id);

		// remove the connection from the user
		delete this._users[userId].connections[connectionId];

		// remove the user if no connections are left
		if (Object.keys(this._users[userId].connections).length == 0) {

			// remove the user from all rooms
			this._removeUserFromAllRooms(userId);

			// remove the user itself
			delete this._users[userId];
		}
	}

	/**
	 * Refreshes the rooms that the user is subscribed to 
	 * by fetching a fresh list of rooms from the database.
	 */
	refreshUser(user){
		let userId = String(user.id);

		// if the user was never added to the message router,
		// then there is nothing to do.
		if (this._users[userId] === undefined) {
			return Promise.resolve();
		}

		// get all rooms of the user is in
		let rooms = user.getRooms()

		// resubscribe to all rooms
		let refreshed = rooms
			.then(rooms => {

				// remove all room subscriptions of the user
				this._removeUserFromAllRooms(userId);

				// add subscriptions for all rooms
				for (let room of rooms) {
					this._addUserToRoom(userId, room);
				}

			});

		return refreshed;
	}

	/**
	 * Sends a message to one specific connection to a client.
	 */
	sendMessageToConnection(user, connectionId, msgType, msgPayload) {
		let userId = String(user.id || user);
		console.log('ws: → to connection', connectionId, msgType)

		if (this._users[userId] !== undefined){
			let connections = this._users[userId].connections;
			if (connections[connectionId] !== undefined) {
				let connection = connections[connectionId];
				connection(msgType, msgPayload);
			}
		}
	}

	/**
	 * Sends a message to all connections of a user
	 */
	sendMessageToUser(user, msgType, msgPayload) {
		let userId = String(user.id || user);
		console.log('ws: → to user', userId, msgType);

		if (this._users[userId] !== undefined) {
			let connections = this._users[userId].connections;
			let connectionIds = Object.keys(connections);
			for (let connectionId of connectionIds) {
				this.sendMessageToConnection(user, connectionId, msgType, msgPayload);
			}
		}
	}

	/**
	 * Sends a message to all connections of users in a room.
	 */
	sendMessageToRoom(room, msgType, msgPayload) {
		let roomId = String(room.id || room);
		console.log('ws: → to room', roomId, msgType);

		if (this._rooms[roomId] !== undefined) {
			let userIds = this._rooms[roomId].users;
			for (let userId of userIds) {
				this.sendMessageToUser(userId, msgType, msgPayload);
			}
		}
	}
}

module.exports.MessageRouter = MessageRouter;