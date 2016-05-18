
# Websockets

## Messages

A message is a Javascript object that is encoded as a JSON string. This object has to follow the following format:

```
{
	'type': string
	'payload': object
}
```

The format of the payload is dependant of the message type.
Both messages sent from the client to the server, as well as messages from the server to the client follow this format.

## Message types

### AUTHENTICATE

Should be sent from the client to the server to authenticate the client.
The server will answer to such a message with a WELCOME or a UNAUTHENTICATED message,
depending on whether the client could be logged in successfully.

```
{
	'type': 'AUTHENTICATE'
	'payload': {
		'token': string 		// the webtoken
	}
}
```

### WELCOME

Will be sent to a client after a successfull authentication.

```
{
	'type': 'WELCOME'
	'payload': {}
}
```

### UNAUTHENTICATED

Will be sent to a client when 
 - it tries to do an operation, but is not yet authenticated.
 - it tries to do an operation, but the web token that was used for authentication expired in the meantime
 - it tried authenticate, but it failed.

```
{
	'type': 'UNAUTHENTICATED'
	'payload': {}
}
```

### ERROR

Will be sent to the client, when something went wrong.

```
{
	'type': 'UNAUTHENTICATED'
	'payload': {/* Depending on the type of error there might be additional information here. */}
}
```