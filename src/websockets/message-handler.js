
/**
 * handles the message X
 */
function handleX(core, payload, user, connectionId, transactionId) {

}

/**
 * handles the message TextMessage
 */
function handleTextMessage(core, payload, user, contextConnectionId, contextTransactionId) {
	let room = payload.roomId;
	let content = payload.text;
	let author = user.id;

	console.log('room:', room);

	// validate: room, content exist
	if (room === undefined) {
		error('missing_room');
	}
	if (content === undefined) {
		error('missing_content');
	}

	// check that the user is in the room
	return user.hasRoom(room)
		.then(inRoom => {
			if (!inRoom) {
				error('not_in_room');
			}
			// create the message
			return core.db.Message.create({
				'content': content,
				'userId': author,
				'roomId': room
			})
		})
		.then(message => {
			// send broadcast
			let res = message.getUserRepresentation();
			res.room = room;
			console.log('room:', room);
			core.router.sendMessageToRoom(room, 'TEXT_MESSAGE', res);
		});
}

/**
 * Calls the correct message handler for a message.
 */
function handleMessage(core, msgType, msgPayload, contextUser, contextConnectionId, contextTransactionId){
	let handler = {
		'TEXT_MESSAGE': handleTextMessage
	}[msgType];

	if (handler === undefined) {

		core.router.sendMessageToConnection(contextUser, contextConnectionId, 'ERROR', {
			'type': 'unsupported_message_type',
			'transactionid': contextTransactionId
		});

	} else {

		try {
			let result = handler(core, msgPayload, contextUser, contextConnectionId, contextTransactionId);

			// on success
			result.then(() => {
				core.router.sendMessageToConnection(contextUser, contextConnectionId, 'SUCCESS', {
					'transactionid': contextTransactionId
				});
				console.log('ws: handler executed successfully.');
			});

			// on failure
			result.catch(e => {
				handleError(e, core, contextUser, contextConnectionId, contextTransactionId);
			});

		} catch (e) {

			// on an even harder failure
			handleError(e, core, contextUser, contextConnectionId, contextTransactionId);
		}
	}
}

/**
 * Throws an error that will result in the given type to be sent 
 * back to the client as an error code.
 */
function error(type = 'unknown') {
	throw {
		'userErrorType': type
	};
}

/**
 * Handles an error by sending a corresponding ERROR message to the client.
 */
function handleError(e, core, contextUser, contextConnectionId, contextTransactionId) {
	let type = e.userErrorType || 'unknown'; 
	core.router.sendMessageToConnection(contextUser, contextConnectionId, 'ERROR', {
		'type': type,
		'transactionid': contextTransactionId
	});
	console.log('ws: Error in handler: ');
	console.log(e);
}

module.exports.handleMessage = handleMessage;