/**
 * Product Model
 * Supports both MongoDB (via Mongoose) and JSON fallback
 */

let ProductModel = null;

if (process.env.MONGODB_URI) {
  const mongoose = require('mongoose');

  const productSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name too long']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Audio', 'Laptops', 'Smartphones', 'Tablets', 'Cameras', 'Wearables', 'Accessories'],
      index: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    originalPrice: {
      type: Number,
      default: null
    },
    image: {
      type: String,
      required: [true, 'Product image is required']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description too long']
    },
    specs: {
      type: Map,
      of: String,
      default: {}
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviews: {
      type: Number,
      default: 0
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    badge: {
      type: String,
      default: '',
      enum: ['', 'New', 'Sale', 'Hot', 'Best Seller', 'Pro', 'Gaming']
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  }, {
    timestamps: true,
    toJSON: { virtuals: true }
  });

  // Index for search
  productSchema.index({ name: 'text', description: 'text', category: 'text' });

  // Virtual: discount percentage
  productSchema.virtual('discountPercent').get(function() {
    if (!this.originalPrice || this.originalPrice <= this.price) return 0;
    return Math.round((1 - this.price / this.originalPrice) * 100);
  });

  ProductModel = mongoose.model('Product', productSchema);
}

module.exports = ProductModel;
