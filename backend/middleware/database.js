/**
 * Database Connection
 * 
 * Supports:
 * - MongoDB via Mongoose (when MONGODB_URI env var is set)
 * - JSON file fallback (when MONGODB_URI is not set)
 * 
 * Usage:
 *   const { connectDB, getAdapter } = require('./middleware/database');
 *   await connectDB();
 *   const db = getAdapter(); // use db.users, db.products, etc.
 */

const path = require('path');
const fs = require('fs');

const DB_FILE = path.join(__dirname, '../data/db.json');

// ─── JSON Adapter ────────────────────────────────────────────────────────────
const jsonAdapter = {
  read() {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  },
  write(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  },
  // Collection helpers
  findAll(collection, filter = {}) {
    const db = this.read();
    let items = db[collection] || [];
    Object.entries(filter).forEach(([k, v]) => {
      items = items.filter(item => item[k] === v);
    });
    return items;
  },
  findOne(collection, filter) {
    return this.findAll(collection, filter)[0] || null;
  },
  insertOne(collection, doc) {
    const db = this.read();
    if (!db[collection]) db[collection] = [];
    db[collection].push(doc);
    this.write(db);
    return doc;
  },
  updateOne(collection, filter, update) {
    const db = this.read();
    const idx = (db[collection] || []).findIndex(item =>
      Object.entries(filter).every(([k, v]) => item[k] === v)
    );
    if (idx >= 0) {
      db[collection][idx] = { ...db[collection][idx], ...update };
      this.write(db);
      return db[collection][idx];
    }
    return null;
  },
  deleteOne(collection, filter) {
    const db = this.read();
    const before = (db[collection] || []).length;
    db[collection] = (db[collection] || []).filter(item =>
      !Object.entries(filter).every(([k, v]) => item[k] === v)
    );
    const deleted = before - db[collection].length;
    this.write(db);
    return deleted > 0;
  }
};

// ─── MongoDB Adapter ─────────────────────────────────────────────────────────
let mongooseInstance = null;

async function connectMongo() {
  const mongoose = require('mongoose');
  mongoose.set('strictQuery', false);

  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  mongooseInstance = conn;
  console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  return conn;
}

// ─── Public API ──────────────────────────────────────────────────────────────
let usesMongo = false;

async function connectDB() {
  if (process.env.MONGODB_URI) {
    try {
      await connectMongo();
      usesMongo = true;
      console.log('📦 Using MongoDB for storage');
    } catch (err) {
      console.error('⚠️  MongoDB connection failed, falling back to JSON storage:', err.message);
      usesMongo = false;
    }
  } else {
    console.log('📦 Using JSON file storage (set MONGODB_URI to use MongoDB)');
  }
}

function isUsingMongo() {
  return usesMongo;
}

function getJsonAdapter() {
  return jsonAdapter;
}

module.exports = { connectDB, isUsingMongo, getJsonAdapter };
