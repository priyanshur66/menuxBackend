import express from 'express';
import {
  createMenu,
  getAllMenus,
  getMenuById,
  updateMenu,
  deleteMenu,
  updateMenuWithImages
} from '../controllers/menu.controller.js';
import upload from '../middlewares/upload.middleware.js';
import { protect, authorize, verifyRestaurantOwner } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All menu routes require authentication
router.use(protect);

// Create a new menu from uploaded images (requires restaurant ownership)
router.post('/', 
  upload.array('images', 10), 
  verifyRestaurantOwner, 
  createMenu
);

// Get all menus (users see only their own, admins see all)
router.get('/', getAllMenus);

// Get a specific menu by ID (user must own the menu or be admin)
router.get('/:id', getMenuById);

// Update a menu's data without images (user must own the menu)
router.put('/:id', 
  verifyRestaurantOwner,
  updateMenu
);

// Update a menu with new images (user must own the menu)
router.put('/:id/images', 
  upload.array('images', 10), 
  verifyRestaurantOwner,
  updateMenuWithImages
);

// Delete a menu (user must own the menu)
router.delete('/:id',
  verifyRestaurantOwner, 
  deleteMenu
);

export default router; 