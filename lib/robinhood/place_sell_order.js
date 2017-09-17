const User = require('../../models/user.model.js');
const robinhood = require('robinhood');
module.exports = (user_id, symbol, quantity, price) => new Promise((resolve, reject) => {
    User.findById(user_id, (err, user) => {
        const credentials = {
            username: user.robinhood_username,
            password: user.robinhood_password
        };

        const Robinhood = robinhood(credentials, () => {
            Robinhood.place_sell_order({
                type: 'limit',
                quantity: quantity,
                bid_price: price,
                instrument: {
                    symbol: symbol
                },
                trigger: 'gtc',
                time: 'day'
                // // Optional:
                // trigger: String, // Defaults to "gfd" (Good For Day)
                // time: String,    // Defaults to "immediate"
                // type: String     // Defaults to "market"
            }, (error, response, body) => {
                if (error) {
                    return reject(error); //console.error(error);
                } else {
                    return resolve(body); //console.log(body);
                }
            });
        });
    });
});