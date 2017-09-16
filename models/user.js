const mongoose = require('mongoose');
module.exports = mongoose.model('User', {
    name: {
        type: String,
        required: true,
    },
    facebook_profile_id: {
        type: String,
        required: true,
    },
    robinhood_username: {
        type: String
    },
    robinhood_password: {
        type: String
    },
    "coinbase_access_token": {
        type: String
    },
    "coinbase_refresh_token": {
        type: String
    }
});