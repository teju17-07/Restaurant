// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Restaurant Schema
const restaurantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    menu: [
        {
            item: { type: String, required: true },
            price: { type: Number, required: true },
        },
    ],
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    items: [
        {
            item: { type: String, required: true },
            quantity: { type: Number, required: true },
        },
    ],
    total: { type: Number, required: true },
});

const Order = mongoose.model('Order', orderSchema);

// Routes

// Get all restaurants
app.get('/restaurants', async (req, res) => {
    try {
        const restaurants = await Restaurant.find();
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a new restaurant
app.post('/restaurants', async (req, res) => {
    const restaurant = new Restaurant(req.body);
    try {
        const savedRestaurant = await restaurant.save();
        res.status(201).json(savedRestaurant);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Place a new order
app.post('/orders', async (req, res) => {
    const { restaurantId, items } = req.body;

    // Calculate total price
    let total = 0;
    for (const item of items) {
        const restaurant = await Restaurant.findById(restaurantId);
        const menuItem = restaurant.menu.find(menuItem => menuItem.item === item.item);
        if (menuItem) {
            total += menuItem.price * item.quantity;
        } else {
            return res.status(400).json({ message: `Item ${item.item} not found in restaurant menu.` });
        }
    }

    const order = new Order({
        restaurantId,
        items,
        total,
    });

    try {
        const savedOrder = await order.save();
        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get all orders
app.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find().populate('restaurantId');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});