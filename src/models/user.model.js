import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in query results by default
  },
  role: {
    type: String,
    enum: ['owner', 'admin'],
    default: 'owner'
  },
  restaurants: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    }
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true,
  versionKey: false
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Create JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET || 'your-jwt-secret-key-should-be-in-env-file',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Compare entered password with stored hashed password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if user owns a specific restaurant
userSchema.methods.ownsRestaurant = function(restaurantName) {
  return this.restaurants.some(restaurant => 
    restaurant.name.toLowerCase() === restaurantName.toLowerCase()
  );
};

const User = mongoose.model('User', userSchema);

export default User; 