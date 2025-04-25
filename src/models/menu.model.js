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
  menu: [categorySchema],
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, { 
  timestamps: true,
  versionKey: false
});

const Menu = mongoose.model('Menu', menuSchema);

export default Menu; 