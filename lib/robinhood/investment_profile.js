const robinhood = require('robinhood');

module.exports = (Robinhood) => {
    return Promise((resolve, reject) => {
        Robinhood.investment_profile((err, res, body) => {
            if (err) {
                return res.status(500).send(err);
            }
            re
        });
    })
    
}