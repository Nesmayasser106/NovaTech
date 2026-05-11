/**
 * Orders Routes
 * POST /api/orders         — place order (protected)
 * GET  /api/orders         — get user's orders (protected)
 * GET  /api/orders/:id     — get single order (protected)
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { isUsingMongo, getJsonAdapter } = require('../middleware/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/orders
router.post('/', async (req, res) => {
  try {
    const { items, shipping, paymentMethod } = req.body;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: 'Cart cannot be empty' });
    if (!shipping?.name || !shipping?.address || !shipping?.city)
      return res.status(400).json({ error: 'Shipping information is incomplete' });

    if (isUsingMongo()) {
      const Product = require('../models/Product');
      const Order = require('../models/Order');

      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Product.findById(item.id);
        if (!product) return res.status(400).json({ error: `Product not found: ${item.id}` });
        if (!item.quantity || item.quantity < 1)
          return res.status(400).json({ error: `Invalid quantity for ${product.name}` });

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;
        orderItems.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          image: product.image,
          total: itemTotal
        });
      }

      const shippingCost = subtotal >= 500 ? 0 : 19.99;
      const tax = parseFloat((subtotal * 0.08).toFixed(2));
      const total = parseFloat((subtotal + shippingCost + tax).toFixed(2));

      const order = new Order({
        user: req.user.id,
        userEmail: req.user.email,
        userName: req.user.name,
        items: orderItems,
        shipping,
        paymentMethod: paymentMethod || 'card',
        subtotal: parseFloat(subtotal.toFixed(2)),
        shippingCost,
        tax,
        total,
        status: 'confirmed'
      });

      await order.save();
      return res.status(201).json({ message: 'Order placed successfully!', order });
    } else {
      const db = getJsonAdapter();
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = db.findOne('products', { id: item.id });
        if (!product) return res.status(400).json({ error: `Product not found: ${item.id}` });
        if (!item.quantity || item.quantity < 1)
          return res.status(400).json({ error: `Invalid quantity for ${product.name}` });

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;
        orderItems.push({ productId: product.id, name: product.name, price: product.price, quantity: item.quantity, image: product.image, total: itemTotal });
      }

      const shippingCost = subtotal >= 500 ? 0 : 19.99;
      const tax = parseFloat((subtotal * 0.08).toFixed(2));
      const total = parseFloat((subtotal + shippingCost + tax).toFixed(2));

      const order = {
        id: uuidv4(),
        orderNumber: `GE-${Date.now()}`,
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.name,
        items: orderItems,
        shipping,
        paymentMethod: paymentMethod || 'card',
        subtotal: parseFloat(subtotal.toFixed(2)),
        shippingCost,
        tax,
        total,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      };

      db.insertOne('orders', order);
      return res.status(201).json({ message: 'Order placed successfully!', order });
    }
  } catch (err) {
    console.error('[Checkout]', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    if (isUsingMongo()) {
      const Order = require('../models/Order');
      const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
      return res.json({ orders });
    } else {
      const db = getJsonAdapter();
      const orders = db.findAll('orders', { userId: req.user.id })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ orders });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    if (isUsingMongo()) {
      const Order = require('../models/Order');
      const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
      if (!order) return res.status(404).json({ error: 'Order not found' });
      return res.json({ order });
    } else {
      const db = getJsonAdapter();
      const order = db.findAll('orders').find(
        o => o.id === req.params.id && o.userId === req.user.id
      );
      if (!order) return res.status(404).json({ error: 'Order not found' });
      return res.json({ order });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
