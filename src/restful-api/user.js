const router = requrire('express');

let router = new Router;

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
	if (password === undefined) {
		res.status(400).json({
			'field': 'password',
			'errorMessage': 'A Password has to be provided.'
		});
		return;
	}
	if (username.length < req.app.core.config.user.usernameMinLength) {
		res.status(400).json({
			'field': 'username',
			'errorMessage': 'Username must have at minimum ' + req.app.core.config.user.userusernameMinLength + ' chars.'
		});
		return;
	}
	if (username.length > req.app.core.config.user.usernameMaxLength) {
		res.status(400).json({
			'field': 'username',
			'errorMessage': 'Username could not have more then ' + req.app.core.config.user.usernameMaxLength + ' chars.'
		});
		return;
	}
	if (/[^a-zA-Z0-9]/.test(username)) {
		res.status(400).json({
			'field': 'username',
			'errorMessage': 'Username must be alphanumeric.'
		});
		return;
	}
	if (password.length < req.app.core.config.user.passwordMinLength) {
		res.status(400).json({
			'field': 'password',
			'errorMessage': 'Password must have at minimum ' + req.app.core.config.user.passwordMinLength + ' chars.'
		});
		return;
	}
	if (password.length > req.app.core.config.user.passwordMaxLength) {
		res.status(400).json({
			'field': 'password',
			'errorMessage': 'Password could not have more then' + req.app.core.config.user.passwordMaxLength + ' chars.'
		});
		return;
	}
	if (email === undefined) email = "";

	//Create the user
	req.app.core.createUser(username, password, email)
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