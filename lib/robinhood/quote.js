const User = require('../../models/user.model.js');
const robinhood = require('robinhood');
module.exports = (user_id, symbol) => new Promise((resolve, reject) => {
    User.findById(user_id, (err, user) => {
        const credentials = {
            username: user.robinhood_username,
            password: user.robinhood_password
        };

        const Robinhood = robinhood(credentials, () => {
            Robinhood.quote_data(symbol, function (err, response, body) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(body);

                }
            });
        });
    });
});