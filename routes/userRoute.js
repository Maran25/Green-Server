const express = require('express');
const route = express.Router();
const { addToWishlist, removeFromWishlist, getFromWishlist, getMyOrders } = require('../controller/userController');

route.post('/wishlist', addToWishlist);
route.delete('/wishlist/:Id', removeFromWishlist);
route.get('/wishlist', getFromWishlist);
route.get('/orders', getMyOrders);

module.exports = route;