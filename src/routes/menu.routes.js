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

const router = express.Router();

// Create a new menu from uploaded images
router.post('/', upload.array('images', 10), createMenu);

// Get all menus
router.get('/', getAllMenus);

// Get a specific menu by ID
router.get('/:id', getMenuById);

// Update a menu's data (without images)
router.put('/:id', updateMenu);

// Update a menu with new images
router.put('/:id/images', upload.array('images', 10), updateMenuWithImages);

// Delete a menu
router.delete('/:id', deleteMenu);

export default router; 