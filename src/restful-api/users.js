const express = require('express');
var jwt = require('jsonwebtoken');

let router = new express.Router;

/**
 * Creates a new user.
 *
 * Expected parameters:
 *	username 	The username used for the new user. Has to be unique.
 *	password 	The password for the new user.
 * 	email 		(optional) The email address of the new user that is used to fetch the gravatar profile picture.
 *
 * Returns on success:
 *	201 - the newly created user will be returned.
 * 	Output format:
 *	{
 *		'id': int,
 *		'username': string,
 *		'icon': string 			// this is a URL to a gravatar icon
 * 		'email': string
 *	}
 *
 * Returns on failure:
 *	400 - The given user data was not valid.
 *	403 - The username already exists.
 *	
 */
router.post('/', (req, res) => {

	let {
		username,
		password,
		email
	} = req.body;

	if (email === '') email = undefined;

	// Create the user
	let user = req.app.core.db.User.build({
		'username': username,
		'email': email
	});

	// Validate the user + password
	let validateResult = user.validate();
	let validatePasswordResult = user.validatePassword(password);

	validateResult = validateResult.concat(validatePasswordResult);

	if (validateResult.length > 0) {
		res.status(400).json({
			"errors": validateResult
		});
		return;
	}

	// Save
	user.setPassword(password);
	user.save()
		.then(user => {
			res.status(201).json(user.getUserRepresentation());
		})
		.catch(function(e) {
			if (e.name && e.name == 'SequelizeUniqueConstraintError') {
				res.status(403).json({
					errors: [{
						'field': 'username',
						'errorMessage': 'Username is already in use.'
					}]
				});
			} else {
				res.status(500).json({
					errors: [{
						'errorMessage': 'Unexpected error.'
					}]
				});
				console.log(e);
			}
		});
});

/**
 * Loggs in a user
 *
 * Expected parameters:
 *	username
 *	password
 *
 * Returns on success:
 *  200 - A web token that has to be provided to all further requests.
 *	Output format:
 *	{
 *		'token': string 		// the web token
 *		'user': object 			// the user that was logged in. The structure is the same like at 'POST /'.
 * 	}
 *
 * Returns on failure:
 *  400 - Invalid request. Username or password is missing.
 *  401 - Login failed
 *  500 - Unexpected error
 */
router.post('/login', (req, res) => {

	let {
		username,
		password
	} = req.body;

	let errors = [];

	// check that both username and password are given
	if (username === undefined) {
		errors.push({
			'field': 'username',
			'errorMessage': 'A username has to be provided.'
		});
	}
	if (password === undefined) {
		errors.push({
			'field': 'password',
			'errorMessage': 'A password has to be provided.'
		});
	}
	if (errors.length > 0) {
		res.status(400).json({
			'errors': errors
		});
		return;
	}

	// find the user
	let user = req.app.core.db.User
		.findOne({
			where: {
				username: username
			}
		});

	// check the password & create the web token & send response
	let done = user.then(user => {
		if (user && user.checkPassword(password)) {

			// username & password are correct
			let token = user.createWebToken()

			res.status(200).json({
				'token': token,
				'user': user.getUserRepresentation()
			});
		} else {

			// invalid username or password
			res.status(401).json({
				"errors": [{
					'field': 'unauthorized',
					'errorMessage': 'Invalid username and password combination.'
				}]
			});
		}
	})

	// handle errors
	done.catch(function(e) {
		res.status(500).json({
			errors: [{
				'errorMessage': 'Unexpected error.'
			}]
		});
		console.log(e);
	});
});

/**
 * Checks whether a token is still valid.
 *
 * On success:
 * 200 - Returns the user that corresponds to the token.
 *
 * On failure:
 * 401 - The token is expired or wrong or was not provided.
 */
router.get('/restricted', (req, res) => {
	res.status(200).json(req.user.getUserRepresentation());
});


/**
 * Updates a user
 *
 * On success:
 * 200 - Returns the user that corresponds to the token.
 *
 * On failure:
 * 403 - Wrong password.
 * 403 - Username in already in use.
 * 403 - You are only allowed to upadte yourself.
 * 400 - Client errors.
 * 500 - Unexpected error
 */
router.put("/", (req, res) => {
	let {
		id,
		username,
		email,
		oldpassword,
		newpassword
	} = req.body;

	let errors = [];

	// Check if authenticated user only updates himself
	if (req.user.id !== parseInt(id)) {
		res.status(403).json({
			errors: [{
				'field': 'id',
				'errorMessage': 'You are only allowed to update yourself.'
			}]
		});
		return;
	}

	// Check if old password is unequal to new pasword
	if (newpassword && oldpassword !== req.user.password) {
		errors.push({
			field: "oldpassword",
			errorMessage: "Wrong password"
		})
		res.status(403).json(errors);
		return;
	}

	// Find user
	let user = req.app.core.db.User.findById(id)
		.then(user => {
			// Havnt found user so throw error and inform client
			if (user === null) {
				let error = new Error();
				error.name = "Client Error";
				error.errors = [{
					field: "id",
					errorMessage: "Unknown user id."
				}];
				throw error;
			}
			// If values are set => update them
			if (username)
				user.set("username", username)
			if (email)
				user.set("email", email)

			if (newpassword) {
				// Validate the user + password
				let validateResult = user.validate()
				let validatePasswordResult = user.validatePassword(newpassword)

				validateResult = validateResult.concat(validatePasswordResult)

				if (validateResult.length > 0) {
					let error = new Error();
					error.name = "Client Error";
					error.errors = validateResult;
					throw error;
				}
				user.setPassword(newpassword);
			}
			return user;
		})
		.then(user => user.save()) // Save user
		.then(user => {
			// Send new user object to client
			res.status(201).json(user.getUserRepresentation());
		})
		.catch(function(e) {
			// Handle errors
			if (e.name && e.name == 'SequelizeUniqueConstraintError') {
				res.status(403).json({
					errors: [{
						'field': 'username',
						'errorMessage': 'Username is already in use.'
					}]
				});
			} else if (e.name && e.name === "Client Error") {
				res.status(400).json({
					errors: e.errors
				});
			} else {
				console.log(e.name);
				res.status(500).json({
					errors: [{
						'errorMessage': 'Unexpected error.'
					}]
				});
			}
		});
});

/**
 * Searches for a user
 *
 * On success:
 * 200 - Returns a result set (contains all maching users)
 *
 */
router.get("/search", (req, res) => {
	let {
		query
	} = req.query;

	// Execute the query
	req.app.core.db.User.findAll({
			where: [`username like '%${ query }%' or email like '%${ query }%'`]
		})
		.then(results => results.map(user => user.getUserRepresentation())) // Get user representations for all results
		.then(results => {
			// Search for index of the requesting user
			let mySelfIndex = results.findIndex(user => req.user.id === user.id);

			if (mySelfIndex >= 0) {
				// Remove my self
				results.splice(mySelfIndex, 1);
			}

			// If there are much results, only return the first 100
			if(results.length > 100){
				results = results.slice(0, 99);
			}

			// Send results to client
			res.json(results);
		});
});

module.exports = router;
