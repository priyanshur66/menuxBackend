import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  is_vegetarian: {
    type: Boolean,
    default: false
  },
  image_url: {
    type: String,
    required: false
  }
}, { _id: false });

const categorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true
  },
  items: [menuItemSchema]
}, { _id: false });

const menuSchema = new mongoose.Schema({
  restaurant_name: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  menu: [categorySchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true,
  versionKey: false
});

// Index for quick search by restaurant name and owner
menuSchema.index({ restaurant_name: 1, owner: 1 });

const Menu = mongoose.model('Menu', menuSchema);

export default Menu; 