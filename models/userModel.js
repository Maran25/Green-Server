const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    password: { type: 'string', required: true },
    wishlist: { type: 'array' },
    order: { type: 'array' }
})

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;