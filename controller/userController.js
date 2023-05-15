const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Order = require("../models/orderModel");

const register = async (req, res) => {
  const { name, email, password } = req.body;

  const isExist = await User.findOne({ email: email });
  if (isExist) {
    return res.status(500).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 8);

  User.create({ name, email, password: hashedPassword })
    .then((user) => {
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET_KEY);
      res.status(201).json({ token: token, user: user });
    })
    .catch((err) => res.status(400).json({ message: err.message }));
};

const login = async (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email: email })
  .then((user) => {
    if (!user) {
      return res.status(500).json({ message: "User does not exist" });
    }
    bcrypt.compare(password, user.password)
      .then((result) => {
        if (result) {
          const token = jwt.sign({ email }, process.env.JWT_SECRET_KEY);
          return res.status(200).json({ token: token, user: user });
        } else {
          return res.status(401).json({ message: "Password is incorrect" });
        }
      })
      .catch((error) => {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
      });
  })
  .catch((error) => {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  });

};

const addToWishlist = async (req, res) => {
  const { product } = req.body; //I AM RECEIVING IT AS PRODUCT
  const { email } = req.user;
  try {
    const user = await User.findOne({ email });
    if (user) {
      const wishlist = user.wishlist;
      if (!wishlist.some((p) => p._id === product._id)) {
        wishlist.push(product);
        user.save();
        res.sendStatus(200);
      }
      //  else {
      //   res.status(200).json({ message: "product already exists in wishlist" });
      // }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeFromWishlist = async (req, res) => {
  const { Id } = req.params;
  const { email } = req.user;
  try {
    const user = await User.findOne({ email });
    if (user) {
      const modifiedWishlist = user.wishlist.filter(wishlist => wishlist._id !== Id);
      user.wishlist = modifiedWishlist;
      user.save();
      // res.status(200).json({ message: "removed from wishlist" });
      res.sendStatus(200);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFromWishlist = async (req, res) => {
  const {email} = req.user;
  try {
    const user = await User.findOne({email});
    if (user) {
      const wishlist = user.wishlist;
      res.status(200).json(wishlist);
    }
  } catch (error) {
    res.status(500).json({message: error.message});
  }
}

const getMyOrders = async (req, res) => {
  const { email } = req.user;
  console.log(email);
  try {
    const orders = await Order.find({user: email});
    console.log(orders)
    res.status(200).json(orders)
  } catch (error) {
    res.status(500).json({message: error.message});
  }
}

module.exports = { register, login, addToWishlist, removeFromWishlist, getFromWishlist, getMyOrders };
