/**
 * GradientTech E-Commerce Server
 * 
 * Architecture:
 *  - Express.js REST API
 *  - MongoDB (preferred) or JSON file fallback
 *  - JWT authentication
 *  - Serves static frontend
 * 
 * Start: node server.js
 * Dev:   npm run dev
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./middleware/database');

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (dev)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString().slice(11, 19)} ${req.method} ${req.path}`);
    next();
  });
}

// Serve static frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── API Routes ───────────────────────────────────────────────────────────────
// Auth: supports both /api/auth/login and /api/login (legacy)
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes);           // backward compat flat routes

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Also support POST /api/checkout as alias for orders
const { authMiddleware } = require('./middleware/auth');
const ordersRouter = require('./routes/orders');
app.use('/api/checkout', authMiddleware, (req, res) => {
  req.url = '/';
  ordersRouter(req, res, (err) => {
    if (err) res.status(500).json({ error: err.message });
  });
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'GradientTech API',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// ─── Frontend SPA Fallback ────────────────────────────────────────────────────
const HTML_PAGES = [
  '/', '/products', '/product-details', '/cart',
  '/about', '/auth', '/orders', '/checkout'
];

HTML_PAGES.forEach(route => {
  app.get(route, (req, res) => {
    const file = route === '/' ? 'index' : route.slice(1);
    const filePath = path.join(__dirname, `../frontend/${file}.html`);
    res.sendFile(filePath, err => {
      if (err) res.status(404).send('Page not found');
    });
  });
});

// ─── Error Handlers ───────────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
  }
  res.status(404).send('Page not found');
});

app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║      GradientTech E-Commerce API       ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`\n  Server:   http://localhost:${PORT}`);
    console.log(` API:      http://localhost:${PORT}/api`);
    console.log(`  Frontend: http://localhost:${PORT}`);
    console.log(`  Storage:  ${process.env.MONGODB_URI ? 'MongoDB' : 'JSON File'}`);
    console.log('\n  Routes:');
    console.log('  POST  /api/auth/register');
    console.log('  POST  /api/auth/login');
    console.log('  GET   /api/products');
    console.log('  GET   /api/products/:id');
    console.log('  POST  /api/orders');
    console.log('  GET   /api/orders\n');
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
