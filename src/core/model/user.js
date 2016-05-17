const Sequelize = require('sequelize');
const crypto = require('crypto');

function defineUser(core, sequelize) {

    let User = sequelize.define('user', {
        'username': {
            'type': Sequelize.STRING,
            'unique': true,
            'allowNull': false
        },
        'email': {
            'type': Sequelize.STRING,
            'allowNull': true
        },
        'passwordSalt': {
            'type': Sequelize.STRING,
            'allowNull': false
        },
        'passwordHash': {
            'type': Sequelize.STRING,
            'allowNull': false
        }
    }, {
        'instanceMethods': {

            /**
             * Checks whether the password matches to the users password.
             * Returns true, if the passwords are the same. False otherwises.
             */
            'checkPassword': function(password) {
                let hash = crypto
                    .createHash('md5')
                    .update(password + this.passwordSalt)
                    .digest('hex');
                return this.passwordHash === hash;
            },

            /**
             * Sets the password to the given string.
             */
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

            /**
             * Returns a URL to the profile image of the user 
             * on gravatar.
             */
            'getGravatarUrl': function() {
                const baseUrl = '//www.gravatar.com/avatar/';
                let gravatarEmail = this.email
                    .toLowerCase()
                    .trim();
                let gravatarHash = crypto
                    .createHash('md5')
                    .update(gravatarEmail)
                    .digest('hex');
                let gravatarUrl = baseUrl + gravatarHash;
            },

            /**
             * Returns a representation of the user that
             * can be sent to clients over the RESTful API.
             * (It is cleaned to not contain any internal data.)
             */
            'getUserRepresentation': function() {
                return {
                    'username': this.username,
                    'icon': this.getGravatarUrl
                };
            },

            'validateUsername': function() {
                let errors = [];
                if (this.username.length < core.config.user.usernameMinLength) {
                    errors.push({
                        'field': 'username',
                        'errorMessage': 'Username must have at minimum ' + core.config.user.userusernameMinLength + ' chars.'
                    });
                }
                if (this.username.length > core.config.user.usernameMaxLength) {
                    errors.push({
                        'field': 'username',
                        'errorMessage': 'Username could not have more then ' + core.config.user.usernameMaxLength + ' chars.'
                    });
                }
                if (/[^a-zA-Z0-9]/.test(this.username)) {
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