/**
 * User Model
 * Supports both MongoDB (via Mongoose) and JSON fallback
 */

// ─── MongoDB Schema (used when MONGODB_URI is set) ───────────────────────────
let UserModel = null;

if (process.env.MONGODB_URI) {
  const mongoose = require('mongoose');
  const bcrypt = require('bcryptjs');

  const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });

  // Hash password before saving
  userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
  });

  // Instance method: compare passwords
  userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  // Remove password from JSON output
  userSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    return obj;
  };

  UserModel = mongoose.model('User', userSchema);
}

module.exports = UserModel;
