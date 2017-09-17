const mongoose = require('mongoose');
module.exports = mongoose.Collection('messages', {
    user_id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    command: {
        type: String
    },
    validated: {
        type: Boolean
    },
    context: {
        type: Object // the context is any additional information helpful for subsequent requets
    },
    timestamp: { type: Date, default: Date.now }
});