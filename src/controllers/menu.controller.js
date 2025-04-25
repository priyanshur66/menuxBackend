import Menu from '../models/menu.model.js';
import { extractMenuFromImages } from '../utils/openai.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create a new menu from uploaded images
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const createMenu = async (req, res) => {
  console.log(`[Controller] Starting menu creation process at ${new Date().toISOString()}`);
  try {
    // Check if files were uploaded
    console.log(`[Controller] Checking uploaded files`);
    if (!req.files || req.files.length === 0) {
      console.log(`[Controller] No image files uploaded`);
      return res.status(400).json({
        success: false,
        message: 'No image files were uploaded'
      });
    }

    // Check if restaurant name was provided
    const providedRestaurantName = req.body.restaurant_name;
    if (providedRestaurantName) {
      console.log(`[Controller] Restaurant name provided: "${providedRestaurantName}"`);
    } else {
      console.log(`[Controller] No restaurant name provided, will extract from images`);
    }

    console.log(`[Controller] ${req.files.length} images received`);
    req.files.forEach((file, index) => {
      console.log(`[Controller] Image ${index + 1}: ${file.originalname}, size: ${file.size} bytes, mimetype: ${file.mimetype}, saved as: ${file.filename}`);
    });

    // Get file paths of all uploaded images
    console.log(`[Controller] Preparing file paths for processing`);
    const imagePaths = req.files.map(file => {
      const fullPath = file.path;
      console.log(`[Controller] File path for ${file.filename}: ${fullPath}`);
      return fullPath;
    });

    // Extract menu data from the images using OpenAI
    console.log(`[Controller] Starting menu extraction from images`);
    console.time(`[Controller] Menu extraction duration`);
    const menuData = await extractMenuFromImages(imagePaths);
    console.timeEnd(`[Controller] Menu extraction duration`);
    console.log(`[Controller] Menu extraction complete`);

    // Override restaurant name if provided
    if (providedRestaurantName) {
      console.log(`[Controller] Overriding extracted restaurant name "${menuData.restaurant_name}" with provided name "${providedRestaurantName}"`);
      menuData.restaurant_name = providedRestaurantName;
    }

    // Save the menu data to the database
    console.log(`[Controller] Creating new menu document in database`);
    const newMenu = new Menu(menuData);
    console.log(`[Controller] Saving menu document for restaurant: "${menuData.restaurant_name}"`);
    console.time(`[Controller] Database save duration`);
    const savedMenu = await newMenu.save();
    console.timeEnd(`[Controller] Database save duration`);
    console.log(`[Controller] Menu saved successfully with ID: ${savedMenu._id}`);

    res.status(201).json({
      success: true,
      message: 'Menu created successfully',
      data: savedMenu
    });
    console.log(`[Controller] Menu creation process completed successfully`);
  } catch (error) {
    console.error(`[Controller] Error creating menu:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating menu'
    });
    console.log(`[Controller] Menu creation process failed`);
  }
};

/**
 * Get all menus
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getAllMenus = async (req, res) => {
  console.log(`[Controller] Fetching all menus at ${new Date().toISOString()}`);
  try {
    console.time(`[Controller] Database query duration`);
    const menus = await Menu.find();
    console.timeEnd(`[Controller] Database query duration`);
    console.log(`[Controller] Found ${menus.length} menus`);
    
    res.status(200).json({
      success: true,
      count: menus.length,
      data: menus
    });
    console.log(`[Controller] Successfully returned all menus`);
  } catch (error) {
    console.error(`[Controller] Error fetching menus:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching menus'
    });
  }
};

/**
 * Get menu by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getMenuById = async (req, res) => {
  const { id } = req.params;
  console.log(`[Controller] Fetching menu with ID: ${id} at ${new Date().toISOString()}`);
  try {
    console.time(`[Controller] Database query duration`);
    const menu = await Menu.findById(id);
    console.timeEnd(`[Controller] Database query duration`);
    
    if (!menu) {
      console.log(`[Controller] Menu with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }
    
    console.log(`[Controller] Found menu for restaurant: "${menu.restaurant_name}"`);
    res.status(200).json({
      success: true,
      data: menu
    });
    console.log(`[Controller] Successfully returned menu with ID: ${id}`);
  } catch (error) {
    console.error(`[Controller] Error fetching menu:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching menu'
    });
  }
};

/**
 * Update menu by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const updateMenu = async (req, res) => {
  const { id } = req.params;
  console.log(`[Controller] Updating menu with ID: ${id} at ${new Date().toISOString()}`);
  try {
    const updateData = req.body;
    console.log(`[Controller] Update data received:`, JSON.stringify(updateData, null, 2));
    
    // Validate update data
    if (!updateData || Object.keys(updateData).length === 0) {
      console.log(`[Controller] No update data provided`);
      return res.status(400).json({
        success: false,
        message: 'No update data provided'
      });
    }

    // Find and update the menu
    console.log(`[Controller] Updating menu document in database`);
    console.time(`[Controller] Database update duration`);
    const updatedMenu = await Menu.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    console.timeEnd(`[Controller] Database update duration`);
    
    if (!updatedMenu) {
      console.log(`[Controller] Menu with ID ${id} not found for update`);
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }
    
    console.log(`[Controller] Menu updated successfully`);
    res.status(200).json({
      success: true,
      message: 'Menu updated successfully',
      data: updatedMenu
    });
    console.log(`[Controller] Successfully returned updated menu`);
  } catch (error) {
    console.error(`[Controller] Error updating menu:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating menu'
    });
  }
};

/**
 * Delete menu by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const deleteMenu = async (req, res) => {
  const { id } = req.params;
  console.log(`[Controller] Deleting menu with ID: ${id} at ${new Date().toISOString()}`);
  try {
    // Find and delete the menu
    console.log(`[Controller] Removing menu from database`);
    console.time(`[Controller] Database delete duration`);
    const deletedMenu = await Menu.findByIdAndDelete(id);
    console.timeEnd(`[Controller] Database delete duration`);
    
    if (!deletedMenu) {
      console.log(`[Controller] Menu with ID ${id} not found for deletion`);
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }
    
    console.log(`[Controller] Deleted menu for restaurant: "${deletedMenu.restaurant_name}"`);
    res.status(200).json({
      success: true,
      message: 'Menu deleted successfully'
    });
    console.log(`[Controller] Successfully completed menu deletion`);
  } catch (error) {
    console.error(`[Controller] Error deleting menu:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting menu'
    });
  }
};

/**
 * Update menu with new images
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const updateMenuWithImages = async (req, res) => {
  const { id } = req.params;
  console.log(`[Controller] Updating menu with new images for ID: ${id} at ${new Date().toISOString()}`);
  try {
    // Check if menu exists
    console.log(`[Controller] Checking if menu exists`);
    console.time(`[Controller] Menu existence check duration`);
    const existingMenu = await Menu.findById(id);
    console.timeEnd(`[Controller] Menu existence check duration`);
    
    if (!existingMenu) {
      console.log(`[Controller] Menu with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }
    console.log(`[Controller] Found existing menu for restaurant: "${existingMenu.restaurant_name}"`);

    // Check if restaurant name was provided
    const providedRestaurantName = req.body.restaurant_name;
    if (providedRestaurantName) {
      console.log(`[Controller] New restaurant name provided: "${providedRestaurantName}"`);
    } else {
      console.log(`[Controller] No new restaurant name provided`);
    }

    // Check if files were uploaded
    console.log(`[Controller] Checking uploaded files`);
    if (!req.files || req.files.length === 0) {
      console.log(`[Controller] No image files uploaded`);
      return res.status(400).json({
        success: false,
        message: 'No image files were uploaded'
      });
    }

    console.log(`[Controller] ${req.files.length} new images received`);
    req.files.forEach((file, index) => {
      console.log(`[Controller] Image ${index + 1}: ${file.originalname}, size: ${file.size} bytes, mimetype: ${file.mimetype}, saved as: ${file.filename}`);
    });

    // Get file paths of all uploaded images
    console.log(`[Controller] Preparing file paths for processing`);
    const imagePaths = req.files.map(file => {
      const fullPath = file.path;
      console.log(`[Controller] File path for ${file.filename}: ${fullPath}`);
      return fullPath;
    });

    // Extract menu data from the images using OpenAI
    console.log(`[Controller] Starting menu extraction from new images`);
    console.time(`[Controller] Menu extraction duration`);
    const menuData = await extractMenuFromImages(imagePaths);
    console.timeEnd(`[Controller] Menu extraction duration`);
    console.log(`[Controller] Menu extraction complete for new data`);

    // Override restaurant name if provided, otherwise keep the existing one
    if (providedRestaurantName) {
      console.log(`[Controller] Using provided restaurant name: "${providedRestaurantName}"`);
      menuData.restaurant_name = providedRestaurantName;
    } else if (existingMenu.restaurant_name && !menuData.restaurant_name) {
      // If OpenAI couldn't extract a restaurant name but we already have one, keep it
      console.log(`[Controller] Using existing restaurant name: "${existingMenu.restaurant_name}"`);
      menuData.restaurant_name = existingMenu.restaurant_name;
    }

    // Update the existing menu
    console.log(`[Controller] Updating menu document in database`);
    console.time(`[Controller] Database update duration`);
    const updatedMenu = await Menu.findByIdAndUpdate(
      id,
      menuData,
      { new: true, runValidators: true }
    );
    console.timeEnd(`[Controller] Database update duration`);
    
    console.log(`[Controller] Menu updated successfully with new image data`);
    res.status(200).json({
      success: true,
      message: 'Menu updated successfully with new images',
      data: updatedMenu
    });
    console.log(`[Controller] Successfully returned updated menu`);
  } catch (error) {
    console.error(`[Controller] Error updating menu with images:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating menu with images'
    });
  }
};

export default {
  createMenu,
  getAllMenus,
  getMenuById,
  updateMenu,
  deleteMenu,
  updateMenuWithImages
}; 