const express = require('express');

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
			'field': 'username',
			'errorMessage': 'A Username has to be provided.'
		});
		return;
	}
	if (email === '') email = undefined;

	//Create the user
	let user = req.app.core.db.User.build({
		'username': username,
		'email': email
	});

	let validateResult = user.validate();
	let validatePasswordResult = user.validatePassword(password);

	validateResult = validateResult.concat(validatePasswordResult);

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
				'field': 'username',
				'errorMessage': 'Username is already in use.'
			});
		});
});

module.exports = router;