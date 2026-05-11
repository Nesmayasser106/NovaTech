/**
 * Database Seed Script
 * 
 * Populates the database with sample products.
 * Works with both MongoDB and JSON storage.
 * 
 * Usage:
 *   node seed.js           — JSON mode
 *   MONGODB_URI=... node seed.js  — MongoDB mode
 */

require('dotenv').config();

const path = require('path');
const fs = require('fs');

const SAMPLE_PRODUCTS = [
  {
    id: 'p1',
    name: 'Sony WH-1000XM5',
    category: 'Audio',
    price: 349.99,
    originalPrice: 429.99,
    image: 'https://www.magnific.com/free-photo/headphones-displayed-against-dark-background_135010631.htm#fromView=keyword&page=3&position=18&uuid=c18833e5-9bfd-45ea-a6c1-ac92db3f3834&query=Headset',
    description: 'Industry-leading noise canceling headphones with 30-hour battery life, crystal-clear hands-free calling, and exceptional sound quality. Features dual noise sensor technology and Auto NC Optimizer for adaptive noise cancellation.',
    specs: { Battery: '30 hours', Connectivity: 'Bluetooth 5.2', Weight: '250g', Driver: '40mm' },
    rating: 4.8, reviews: 2341, stock: 15, badge: 'Best Seller'
  },
  {
    id: 'p2',
    name: 'Apple MacBook Pro 14"',
    category: 'Laptops',
    price: 1999.99,
    originalPrice: 2199.99,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80',
    description: 'Supercharged by M3 Pro chip with up to 18-hour battery. Features Liquid Retina XDR display, advanced camera system, and studio-quality three-mic array. The ultimate pro laptop.',
    specs: { Chip: 'Apple M3 Pro', RAM: '18GB Unified', Storage: '512GB SSD', Display: '14.2" Liquid Retina XDR' },
    rating: 4.9, reviews: 876, stock: 8, badge: 'New'
  },
  {
    id: 'p3',
    name: 'Samsung Galaxy S24 Ultra',
    category: 'Smartphones',
    price: 1199.99,
    originalPrice: 1299.99,
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80',
    description: 'The ultimate Galaxy experience with Galaxy AI, integrated S Pen, 200MP camera, and titanium frame. Built for productivity and creativity on the go.',
    specs: { Display: '6.8" Dynamic AMOLED', Camera: '200MP Quad', Battery: '5000mAh', Storage: '256GB' },
    rating: 4.7, reviews: 1543, stock: 22, badge: 'Hot'
  },
  {
    id: 'p4',
    name: 'iPad Pro 12.9"',
    category: 'Tablets',
    price: 1099.99,
    originalPrice: 1199.99,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80',
    description: 'The ultimate iPad with M2 chip, Liquid Retina XDR display, and Apple Pencil hover. Thin, light, and incredibly powerful for both creative and professional work.',
    specs: { Chip: 'Apple M2', Display: '12.9" Liquid Retina XDR', Storage: '256GB', Connectivity: 'Wi-Fi 6E + 5G' },
    rating: 4.8, reviews: 654, stock: 11, badge: ''
  },
  {
    id: 'p5',
    name: 'Sony A7 IV Mirrorless',
    category: 'Cameras',
    price: 2499.99,
    originalPrice: 2699.99,
    image: 'https://images.unsplash.com/photo-1516724562728-afc824a36e84?w=600&q=80',
    description: '33MP full-frame BSI CMOS sensor with real-time Eye AF, 4K 60p video, and 10fps continuous shooting. The perfect hybrid camera for both photo and video professionals.',
    specs: { Sensor: '33MP Full-Frame BSI', Video: '4K 60p', ISO: '100-51200', Stabilization: '5-Axis IBIS' },
    rating: 4.9, reviews: 432, stock: 5, badge: 'Pro'
  },
  {
    id: 'p6',
    name: 'Apple Watch Ultra 2',
    category: 'Wearables',
    price: 799.99,
    originalPrice: 849.99,
    image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=600&q=80',
    description: 'The most rugged and capable Apple Watch with precision dual-frequency GPS, 3000 nits brightness, and 60-hour battery in low power mode. Built for extreme adventures.',
    specs: { Case: '49mm Titanium', Battery: '60 hours (low power)', Display: '3000 nits LTPO OLED', Water: '100m depth' },
    rating: 4.7, reviews: 987, stock: 19, badge: 'Sale'
  },
  {
    id: 'p7',
    name: 'ASUS ROG Zephyrus G14',
    category: 'Laptops',
    price: 1549.99,
    originalPrice: 1799.99,
    image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80',
    description: 'Compact gaming powerhouse with Ryzen 9 and RTX 4060, featuring 2560x1600 165Hz display, AniMe Matrix LED lid, and impressive 10-hour battery life.',
    specs: { CPU: 'AMD Ryzen 9 7940HS', GPU: 'RTX 4060 8GB', RAM: '16GB DDR5', Display: '14" QHD+ 165Hz' },
    rating: 4.6, reviews: 765, stock: 7, badge: 'Gaming'
  },
  {
    id: 'p8',
    name: 'Bose QuietComfort Earbuds II',
    category: 'Audio',
    price: 249.99,
    originalPrice: 299.99,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80',
    description: "World's best noise cancelling earbuds with CustomTune technology that personalizes sound and noise cancellation to your unique ear geometry for the perfect fit.",
    specs: { ANC: 'CustomTune personalized', Battery: '6h + 18h case', Driver: 'Custom 9.3mm', IPX: 'IPX4' },
    rating: 4.7, reviews: 1876, stock: 34, badge: ''
  }
];

async function seed() {
  console.log('🌱 Starting database seed...\n');

  if (process.env.MONGODB_URI) {
    // MongoDB seed
    const mongoose = require('mongoose');
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');

      const Product = require('./models/Product');
      await Product.deleteMany({});

      // Convert JSON specs to Map for Mongoose
      const products = SAMPLE_PRODUCTS.map(p => ({
        ...p,
        specs: p.specs,
        isActive: true
      }));

      await Product.insertMany(products);
      console.log(`✅ Seeded ${products.length} products to MongoDB`);
    } catch (err) {
      console.error('❌ MongoDB seed failed:', err.message);
    } finally {
      await mongoose.disconnect();
    }
  } else {
    // JSON seed
    const dbPath = path.join(__dirname, 'data/db.json');
    let db = { users: [], products: [], orders: [] };

    if (fs.existsSync(dbPath)) {
      const existing = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      db.users = existing.users || [];
      db.orders = existing.orders || [];
    }

    db.products = SAMPLE_PRODUCTS;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log(`✅ Seeded ${SAMPLE_PRODUCTS.length} products to JSON database`);
  }

  console.log('\n🎉 Seed complete! Run "npm start" to launch the server.\n');
}

seed();
