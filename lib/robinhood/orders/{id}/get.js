'use strict';

const robinhood = require('robinhood');

module.exports = (req, res) => {
    const robinhood_credentials = req.user.robinhood_credentials;
    robinhood(robinhood_credentials, (err, response, body) => {
        if (err) {
            return res.status(500).send(err);
        }
        
    });
}