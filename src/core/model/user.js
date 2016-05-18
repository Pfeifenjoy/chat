const Sequelize = require('sequelize');
const crypto = require('crypto');
var jwt = require('jsonwebtoken');

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
                if (password === undefined) return false;
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
                let email = this.email || '';
                let gravatarEmail = email
                    .toLowerCase()
                    .trim();
                let gravatarHash = crypto
                    .createHash('md5')
                    .update(gravatarEmail)
                    .digest('hex');
                let gravatarUrl = baseUrl + gravatarHash;
                return gravatarUrl;
            },

            /**
             * Returns a representation of the user that
             * can be sent to clients over the RESTful API.
             * (It is cleaned to not contain any internal data.)
             */
            'getUserRepresentation': function() {
                return {
                    'id': this.id,
                    'username': this.username,
                    'icon': this.getGravatarUrl(),
                    'email': this.email
                };
            },

            /**
             * Validates the user and returns an array of error object.
             * Every error is built like this: 
             * {
             *      'field': 'the field where the error occured at'
             *      'errorMessage': 'a description of the error'
             * }
             * If the user is valid, an empty array ([]) will be returned.
             */
            'validate': function() {
                let errors = [];


                // a username must be present
                if (this.username === undefined) {
                    errors.push({
                        'field': 'username',
                        'errorMessage': 'A username must be given.'
                    });
                    return (errors);
                }

                // the username must not be to short or to long. 
                if (this.username.length < core.config.user.usernameMinLength) {
                    errors.push({
                        'field': 'username',
                        'errorMessage': 'Username must have at minimum ' + core.config.user.userusernameMinLength + ' chars.'
                    });
                }
                if (this.username.length > core.config.user.usernameMaxLength) {
                    errors.push({
                        'field': 'username',
                        'errorMessage': 'Username must not have more then ' + core.config.user.usernameMaxLength + ' chars.'
                    });
                }

                // the username must consist out of alphanumeric characters
                if (/[^a-zA-Z0-9]/.test(this.username)) {
                    errors.push({
                        'field': 'username',
                        'errorMessage': 'Username must be alphanumeric.'
                    });
                }

                // if a email was given (this is optional!), it needs to be a valid one.
                if (this.email){
                    // Source of this RegExp: http://stackoverflow.com/a/1373724
                    const emailRegExp = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
                    if (!emailRegExp.test(this.email)) {
                        errors.push({
                            'field': 'email',
                            'errorMessage': 'Email must be a valid email address.'
                        });
                    }
                }
                return errors;
            },

            /**
             * Checks whether the given password fullfills
             * all password guidlines.
             * 
             * The return format is the same like that of the validate() function.
             */
            'validatePassword': function(password) {
                let errors = [];

                // do not permit empty passwords
                if (password === undefined || password === '') {
                    errors.push({
                        'field': 'password',
                        'errorMessage': 'A password has to be provided.'
                    });
                    return errors;
                }

                // check the password size
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
            },

            /**
             * Creates a web token that can be used to authenticate a user 
             * at the server.
             *
             * The secret and the expiratation TimeStamp are defined in the settings file.
             */
            'createWebToken': function() {
                let token = jwt.sign(this.toJSON(), core.config.session.secret, {
                    expiresIn: core.config.session.expire
                });
                return token;
            }
        }
    });

    return User;

}

module.exports.defineUser = defineUser;