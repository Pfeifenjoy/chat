const Sequelize = require('sequelize');
const crypto    = require('crypto'); 

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
            'getUserRepresentation': function(){
                return {
                    'username': this.username,
                    'icon': this.getGravatarUrl
                };
            }
        }
    });

    return User;

}

module.exports.defineUser = defineUser;