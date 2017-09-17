const User = require('../../models/user.model.js');
const robinhood = require('robinhood');
module.exports = (user_id) => new Promise((resolve, reject) => {
    User.findById(user_id, (err, user) => {
        const credentials = {
            username: user.robinhood_username,
            password: user.robinhood_password
        };
        console.log(credentials);

        const Robinhood = robinhood(credentials, () => {
            Robinhood.orders((error, response, body) => {

                if (error) {
                    console.log("the error", error);
                    return reject(error); //console.error(error);
                } else {
                    return resolve(body); //console.log(body);
                }
            });
        });
    });
});