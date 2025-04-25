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
    if (!providedRestaurantName) {
      console.log(`[Controller] Restaurant name is required`);
      return res.status(400).json({
        success: false,
        message: 'Restaurant name is required'
      });
    }
    console.log(`[Controller] Restaurant name provided: "${providedRestaurantName}"`);

    // Check that user owns this restaurant (this is enforced by middleware)
    console.log(`[Controller] User ${req.user.name} (${req.user._id}) is creating menu for their restaurant "${providedRestaurantName}"`);

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

    // Override restaurant name with the provided one
    console.log(`[Controller] Setting restaurant name to "${providedRestaurantName}"`);
    menuData.restaurant_name = providedRestaurantName;

    // Add owner ID to the menu data
    menuData.owner = req.user._id;
    console.log(`[Controller] Setting menu owner to user ID: ${req.user._id}`);

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
    let query = {};
    
    // If not admin, only show menus owned by this user
    if (req.user && req.user.role !== 'admin') {
      console.log(`[Controller] Restricting menu list to owner: ${req.user._id}`);
      query.owner = req.user._id;
    }
    
    console.time(`[Controller] Database query duration`);
    const menus = await Menu.find(query);
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
    
    // Check if user has permission to view this menu (admin can view all)
    if (req.user.role !== 'admin' && menu.owner.toString() !== req.user._id.toString()) {
      console.log(`[Controller] User ${req.user._id} not authorized to view menu ${id}`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this menu'
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

    // Menu ownership verification done in auth middleware - req.menu contains the menu
    const menu = req.menu;
    
    // Prevent changing ownership
    if (updateData.owner) {
      delete updateData.owner;
    }
    
    // Update the menu
    console.log(`[Controller] Updating menu document in database`);
    console.time(`[Controller] Database update duration`);
    const updatedMenu = await Menu.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    console.timeEnd(`[Controller] Database update duration`);
    
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
    // Menu ownership verification done in auth middleware - req.menu contains the menu
    const menu = req.menu;
    
    // Delete the menu
    console.log(`[Controller] Removing menu from database`);
    console.time(`[Controller] Database delete duration`);
    const deletedMenu = await Menu.findByIdAndDelete(id);
    console.timeEnd(`[Controller] Database delete duration`);
    
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
    // Menu ownership verification done in auth middleware - req.menu contains the menu
    const menu = req.menu;
    
    // Check if restaurant name was provided
    const providedRestaurantName = req.body.restaurant_name;
    if (providedRestaurantName) {
      // Verify ownership of the new restaurant name
      if (!req.user.ownsRestaurant(providedRestaurantName) && req.user.role !== 'admin') {
        console.log(`[Controller] User doesn't own restaurant "${providedRestaurantName}"`);
        return res.status(403).json({
          success: false,
          message: `You don't own the restaurant '${providedRestaurantName}'`
        });
      }
      console.log(`[Controller] New restaurant name provided: "${providedRestaurantName}"`);
    } else {
      console.log(`[Controller] Using existing restaurant name: "${menu.restaurant_name}"`);
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
    } else {
      console.log(`[Controller] Using existing restaurant name: "${menu.restaurant_name}"`);
      menuData.restaurant_name = menu.restaurant_name;
    }

    // Ensure owner ID remains the same
    menuData.owner = menu.owner;

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