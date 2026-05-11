/**
 * Order Model
 * Supports both MongoDB (via Mongoose) and JSON fallback
 */

let OrderModel = null;

if (process.env.MONGODB_URI) {
  const mongoose = require('mongoose');

  const orderItemSchema = new mongoose.Schema({
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
    total: { type: Number, required: true }
  }, { _id: false });

  const shippingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String }
  }, { _id: false });

  const orderSchema = new mongoose.Schema({
    orderNumber: {
      type: String,
      unique: true,
      default: () => `GE-${Date.now()}`
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userEmail: { type: String },
    userName: { type: String },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: v => v.length > 0,
        message: 'Order must contain at least one item'
      }
    },
    shipping: { type: shippingSchema, required: true },
    paymentMethod: {
      type: String,
      default: 'card',
      enum: ['card', 'paypal', 'apple_pay']
    },
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      default: 'confirmed',
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      index: true
    },
    estimatedDelivery: { type: Date },
    notes: { type: String }
  }, {
    timestamps: true,
    toJSON: { virtuals: true }
  });

  // Auto-generate estimated delivery (5 business days)
  orderSchema.pre('save', function(next) {
    if (!this.estimatedDelivery) {
      const delivery = new Date();
      delivery.setDate(delivery.getDate() + 5);
      this.estimatedDelivery = delivery;
    }
    next();
  });

  OrderModel = mongoose.model('Order', orderSchema);
}

module.exports = OrderModel;
