const Sequelize = require('sequelize');
const crypto    = require('crypto'); 

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
        'password_salt': {
            'type': Sequelize.STRING
        },
        'password_hash': {
            'type': Sequelize.STRING
        }
    }, {
        'instanceMethods': {

            'checkPassword': function(password) {
                let hash = crypto
                    .createHash('md5')
                    .update(password + this.password_salt)
                    .digest('hex');
                return this.password_hash === hash;
            },

            'setPassword': function(password) {
                let salt = crypto
                    .randomBytes(32)
                    .toString('hex');
                let hash = crypto
                    .createHash('md5')
                    .update(password + salt)
                    .digest('hex');
                this.password_salt = salt;
                this.password_hash = hash;
            },

            'getUserRepresentation': function(){

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
            }
        }
    });

    return User;

}

module.exports.defineUser = defineUser;