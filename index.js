const express = require("express");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST);
const bodyParser = require("body-parser");
const cors = require("cors");
const authRoute = require("./routes/authRoute");
const userRoute = require("./routes/userRoute");
const isAuthenticated = require("./utils/auth");
const { client, builder } = require("./utils/sanityClient");
const Order = require("./models/orderModel");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.use("/api/auth", authRoute);
app.use("/user", isAuthenticated, userRoute)

app.get("/", function (req, res) {
  res.send("Noice");
});

app.get("/config", (req, res) => {
  res.send({ publishableKey: process.env.STRIPE_PUBLISH_KEY });
});

// app.post("/create-payment-intent", async (req, res) => {
//   const { currency, amount } = req.body;
//   try {
//     const paymentIntent = await stripe.paymentIntents.create({
//       currency: currency || "inr",
//       amount: amount || 1000000,
//       automatic_payment_methods: {
//         enabled: true,
//       },
//     });

//     res.send({ clientSecret: paymentIntent.client_secret });
//   } catch (error) {
//     res.send({ message: error.message });
//   }
// });

app.post("/create-checkout-session", isAuthenticated, async (req, res) => {
  const data = req.body.items || [];
  const { address } = req.body;
  try {
    const lineItems = [];
    let totalAmount = 0;
    for (const item of data) {
      const storeItem = await client.getDocument(item.id);
      const imageUrl = builder.image(storeItem.thumbnail).url();
      lineItems.push({
        price_data: {
          currency: "inr",
          unit_amount: storeItem.price * 100,
          product_data: {
            name: storeItem.title,
            description: storeItem.subtitle,
            images: [imageUrl],
            metadata: {
              size: item.size,
            }
          },
        },
        quantity: item.quantity,
      });
      totalAmount += storeItem.price * item.quantity;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${process.env.CLIENT_URL}/callback/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/callback/failure`,
    })

    const order = new Order({
    user: req.user.email,
    orderId: session.id,
    product: data,
    amount: totalAmount,
    currency: "inr",
    date: new Date(),
    status: "pending",
    })
    await order.save()
    console.log(order);
    
    res.json({ url: session.url })
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `🥲 ${error.message}` })
  }
})

app.post("/stripe-webhook", async (req, res) => {
  const stripeSignature = req.headers['stripe-signature'];
  try {
    const webhookEvent = stripe.webhooks.constructEvent(
      req.body,
      stripeSignature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    if (webhookEvent.type === 'checkout.session.completed') {
      const session = webhookEvent.data.object;
      const order = await Order.findOne({ orderId: session.id });
      if (order) {
        order.status = 'paid';
        await order.save();
      }
    } else if (webhookEvent.type === 'checkout.session.failed') {
      const session = webhookEvent.data.object;
      const order = await Order.findOne({ orderId: session.id });
      if (order) {
        order.status = 'failed';
        await order.save();
      }
    } else if (webhookEvent.type === 'checkout.session.canceled') {
      const session = webhookEvent.data.object;
      const order = await Order.findOne({ orderId: session.id });
      if (order) {
        order.status = 'canceled';
        await order.save();
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});



mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("connected to database successfully ⭐");
  })
  .catch((err) => console.log(err.message));

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started...");
});
