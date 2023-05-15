const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: String,
    orderId: String,
    product: Array,
    amount: Number,
    currency: String,
    date: Date,
    status: String,
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;