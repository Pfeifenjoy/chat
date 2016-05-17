const Sequelize = require('sequelize');
const crypto    = require('crypto'); 

function defineUser(sequelize) {

    let User = sequelize.define('user', {
        'username': {
            'type': Sequelize.STRING
        },
        'password_salt': {
            'type': Sequelize.STRING
        },
        'password_hash': {
            'type': Sequelize.STRING
        },
        'icon_big': {
            'type': Sequelize.BLOB
        },
        'icon_small': {
            'type': Sequelize.BLOB
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
            }
        }
    });

    return User;

}

module.exports.defineUser = defineUser;