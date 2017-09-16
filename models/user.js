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
    
});