import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Menu from '../models/menu.model.js';

/**
 * Protect routes - verify user is authenticated
 */
export const protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Extract token from Bearer token
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      // Or get token from cookie
      token = req.cookies.token;
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'your-jwt-secret-key-should-be-in-env-file'
      );
      
      // Get user from token
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    console.error(`[Auth] Error in protect middleware:`, error);
    res.status(500).json({
      success: false,
      message: 'Error authenticating user'
    });
  }
};

/**
 * Authorize by roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

/**
 * Verify restaurant ownership
 */
export const verifyRestaurantOwner = async (req, res, next) => {
  try {
    // Get restaurant name from request body or params
    const restaurantName = req.body.restaurant_name || req.params.name;
    
    // If no restaurant name, pass to next middleware
    if (!restaurantName) {
      // Check if this is a menu update operation with an ID
      if (req.params.id) {
        // Get the menu and check ownership
        const menu = await Menu.findById(req.params.id);
        
        if (!menu) {
          return res.status(404).json({
            success: false,
            message: 'Menu not found'
          });
        }
        
        // Check if user is the owner of this menu
        if (menu.owner.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to modify this menu'
          });
        }
        
        // Store menu for further use in the controller
        req.menu = menu;
        return next();
      }
      
      return res.status(400).json({
        success: false,
        message: 'Restaurant name is required'
      });
    }
    
    // If user is admin, allow access to any restaurant
    if (req.user.role === 'admin') {
      return next();
    }
    
    // For restaurant owners, check if they own this restaurant
    if (!req.user.ownsRestaurant(restaurantName)) {
      return res.status(403).json({
        success: false,
        message: `You don't own the restaurant '${restaurantName}'`
      });
    }
    
    next();
  } catch (error) {
    console.error(`[Auth] Error in verifyRestaurantOwner middleware:`, error);
    res.status(500).json({
      success: false,
      message: 'Error verifying restaurant ownership'
    });
  }
};

export default {
  protect,
  authorize,
  verifyRestaurantOwner
}; 