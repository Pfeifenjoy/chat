const express = require('express');
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');

let router = new express.Router;

//Route to create a new user
router.post('/', (req, res) => {

	let {
		username,
		password,
		email
	} = req.body;

	if (username === undefined) {
		res.status(400).json({
			"error": [{
				'field': 'username',
				'errorMessage': 'A Username has to be provided.'
			}]
		});
		return;
	}
	if (email === undefined) email = "";

	//Create the user
	let user = req.app.core.db.User.build({
		'username': username,
		'email': email
	});

	let validateUsernameResult = user.validateUsername();
	let validatePasswordResult = user.validatePassword(password);

	let validateResult = validateUsernameResult.concat(validatePasswordResult);

	if (validateResult.length > 0) {
		res.status(400).json({
			"errors": validateResult
		});
		return;
	}

	user.setPassword(password);
	user.save()
		.then(user => {
			res.json(user.getUserRepresentation());
		})
		.catch(function(e) {
			res.status(403).json({
				errors: [{
					'field': 'username',
					'errorMessage': 'Username is already in use.'
				}]
			});
		});
});

//Route to login a user
router.post('/login', (req, res) => {

	let {
		username,
		password
	} = req.body;

	let errors = [];

	if (username === undefined) {
		res.status(400).json({
			"errors": [{
				'field': 'username',
				'errorMessage': 'A Username has to be provided.'
			}]
		});
		return;
	}

	req.app.core.db.User.findOne({
			where: {
				username: username
			}
		}).then(user => {
			if (user.checkPassword(password)) {
				let token = jwt.sign(user.toJSON(), req.app.core.config.session.secret, {
					expiresIn: req.app.core.config.session.expire
				});

				res.json({
					token: token
				});
			} else {
				res.status(401).json({
					"errors": [{
						'field': 'unauthorized',
						'errorMessage': 'Invalid username and password combination.'
					}]
				});
			}
		})
		.catch(function(e) {
			res.status(401).json({
				"errors": [{
					'field': 'unauthorized',
					'errorMessage': 'Invalid username and password combination.'
				}]
			});
		});
});


module.exports = router;