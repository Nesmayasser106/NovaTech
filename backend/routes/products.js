/**
 * Products Routes
 * GET /api/products        — list all products (with filter/sort/search)
 * GET /api/products/:id    — single product + related
 */

const express = require('express');
const { isUsingMongo, getJsonAdapter } = require('../middleware/database');

const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, limit } = req.query;

    if (isUsingMongo()) {
      const Product = require('../models/Product');
      let query = Product.find({ isActive: true });

      if (category && category !== 'all') {
        query = query.where('category').equals(
          category.charAt(0).toUpperCase() + category.slice(1)
        );
      }

      if (search) {
        query = query.or([
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ]);
      }

      const sortMap = {
        'price-asc': { price: 1 },
        'price-desc': { price: -1 },
        'rating': { rating: -1 },
        'name': { name: 1 }
      };
      if (sort && sortMap[sort]) query = query.sort(sortMap[sort]);

      if (limit) query = query.limit(parseInt(limit));

      const products = await query.exec();
      const categories = await Product.distinct('category', { isActive: true });

      return res.json({ products, categories, total: products.length });
    } else {
      const db = getJsonAdapter();
      let products = db.findAll('products');

      if (category && category !== 'all') {
        products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }

      if (search) {
        const q = search.toLowerCase();
        products = products.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }

      if (sort === 'price-asc') products.sort((a, b) => a.price - b.price);
      else if (sort === 'price-desc') products.sort((a, b) => b.price - a.price);
      else if (sort === 'rating') products.sort((a, b) => b.rating - a.rating);
      else if (sort === 'name') products.sort((a, b) => a.name.localeCompare(b.name));

      if (limit) products = products.slice(0, parseInt(limit));

      const allProducts = db.findAll('products');
      const categories = [...new Set(allProducts.map(p => p.category))];

      return res.json({ products, categories, total: products.length });
    }
  } catch (err) {
    console.error('[Products]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    if (isUsingMongo()) {
      const Product = require('../models/Product');
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const related = await Product.find({
        category: product.category,
        _id: { $ne: product._id },
        isActive: true
      }).limit(3);

      return res.json({ product, related });
    } else {
      const db = getJsonAdapter();
      const product = db.findOne('products', { id: req.params.id });
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const related = db.findAll('products')
        .filter(p => p.category === product.category && p.id !== product.id)
        .slice(0, 3);

      return res.json({ product, related });
    }
  } catch (err) {
    console.error('[Product Detail]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
