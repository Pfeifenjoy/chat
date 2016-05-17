const Sequelize = require('sequelize');
const crypto = require('crypto');

function defineUser(sequelize) {

    let User = sequelize.define('user', {
        'username': {
            'type': Sequelize.STRING,
            'unique': true
        },
        'email': {
            'type': Sequelize.STRING,
            'allowNull': true
        },
        'passwordSalt': {
            'type': Sequelize.STRING
        },
        'passwordHash': {
            'type': Sequelize.STRING
        }
    }, {
        'instanceMethods': {

            'checkPassword': function(password) {
                let hash = crypto
                    .createHash('md5')
                    .update(password + this.passwordSalt)
                    .digest('hex');
                return this.passwordHash === hash;
            },

            'setPassword': function(password) {
                let salt = crypto
                    .randomBytes(32)
                    .toString('hex');
                let hash = crypto
                    .createHash('md5')
                    .update(password + salt)
                    .digest('hex');
                this.passwordSalt = salt;
                this.passwordHash = hash;
            },

            'getUserRepresentation': function() {

                // generate the gravatar icon
                const baseUrl = '//www.gravatar.com/avatar/';
                let gravatarEmail = this.email
                    .toLowerCase()
                    .trim();
                let gravatarHash = crypto
                    .createHash('md5')
                    .update(gravatarEmail)
                    .digest('hex');
                let gravatarUrl = baseUrl + gravatarHash;

                // return
                return {
                    'username': this.username,
                    'icon': gravatarUrl
                };
            },

            'validateUsername': function() {
                let errors = [];
                if (username.length < core.config.user.usernameMinLength) {
                    errors.push({
                        'field': 'username',
                        'errorMessage': 'Username must have at minimum ' + core.config.user.userusernameMinLength + ' chars.'
                    });
                }
                if (username.length > core.config.user.usernameMaxLength) {
                    errors.push({
                        'field': 'username',
                        'errorMessage': 'Username could not have more then ' + core.config.user.usernameMaxLength + ' chars.'
                    });
                }
                if (/[^a-zA-Z0-9]/.test(username)) {
                    errors.push({
                        'field': 'username',
                        'errorMessage': 'Username must be alphanumeric.'
                    });
                }
                return errors;
            },

            'validatePassword': function(password) {
                let errors = [];
                if (password === undefined) {
                    errors.push({
                        'field': 'password',
                        'errorMessage': 'A Password has to be provided.'
                    });
                    return;
                }
                if (password.length < core.config.user.passwordMinLength) {
                    errors.push({
                        'field': 'password',
                        'errorMessage': 'Password must have at minimum ' + core.config.user.passwordMinLength + ' chars.'
                    });
                }
                if (password.length > core.config.user.passwordMaxLength) {
                    errors.push({
                        'field': 'password',
                        'errorMessage': 'Password could not have more then' + core.config.user.passwordMaxLength + ' chars.'
                    });
                }
                return errors;
            }
        }
    });

    return User;

}

module.exports.defineUser = defineUser;