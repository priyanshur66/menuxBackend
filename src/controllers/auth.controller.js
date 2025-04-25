import User from '../models/user.model.js';

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req, res) => {
  console.log(`[Auth] Registering new user at ${new Date().toISOString()}`);
  try {
    const { name, email, password, restaurants } = req.body;

    // Check if user already exists
    console.log(`[Auth] Checking if user with email ${email} already exists`);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`[Auth] User with email ${email} already exists`);
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    console.log(`[Auth] Creating new user with email ${email}`);
    const user = await User.create({
      name,
      email,
      password,
      restaurants: restaurants || []
    });

    // Generate token and send response
    sendTokenResponse(user, 201, res, 'User registered successfully');
    console.log(`[Auth] User with email ${email} registered successfully`);
  } catch (error) {
    console.error(`[Auth] Error registering user:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering user'
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req, res) => {
  console.log(`[Auth] User login attempt at ${new Date().toISOString()}`);
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      console.log(`[Auth] Missing email or password in login attempt`);
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if user exists
    console.log(`[Auth] Checking if user with email ${email} exists`);
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`[Auth] No user found with email ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    console.log(`[Auth] Validating password for user ${email}`);
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log(`[Auth] Invalid password for user ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token and send response
    sendTokenResponse(user, 200, res, 'Login successful');
    console.log(`[Auth] User ${email} logged in successfully`);
  } catch (error) {
    console.error(`[Auth] Error logging in:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error logging in'
    });
  }
};

/**
 * Get current logged in user
 * @route GET /api/auth/me
 * @access Private
 */
export const getMe = async (req, res) => {
  console.log(`[Auth] Getting user profile at ${new Date().toISOString()}`);
  try {
    // User is already available from auth middleware
    const user = req.user;

    res.status(200).json({
      success: true,
      data: user
    });
    console.log(`[Auth] Successfully retrieved user profile for ${user.email}`);
  } catch (error) {
    console.error(`[Auth] Error getting user profile:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting user profile'
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/auth/updatedetails
 * @access Private
 */
export const updateDetails = async (req, res) => {
  console.log(`[Auth] Updating user details at ${new Date().toISOString()}`);
  try {
    const { name, email } = req.body;
    const fieldsToUpdate = {};

    if (name) fieldsToUpdate.name = name;
    if (email) fieldsToUpdate.email = email;

    console.log(`[Auth] Updating user with fields:`, fieldsToUpdate);
    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user
    });
    console.log(`[Auth] User details updated successfully`);
  } catch (error) {
    console.error(`[Auth] Error updating user details:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating user details'
    });
  }
};

/**
 * Logout user / clear cookie
 * @route POST /api/auth/logout
 * @access Private
 */
export const logout = (req, res) => {
  console.log(`[Auth] User logout at ${new Date().toISOString()}`);
  
  // Clear token cookie if it exists
  if (res.cookie) {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
  }

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
  console.log(`[Auth] User logged out successfully`);
};

/**
 * Add a restaurant to user's list
 * @route POST /api/auth/restaurants
 * @access Private
 */
export const addRestaurant = async (req, res) => {
  console.log(`[Auth] Adding restaurant to user at ${new Date().toISOString()}`);
  try {
    const { name, description, location } = req.body;

    if (!name) {
      console.log(`[Auth] Restaurant name is required`);
      return res.status(400).json({
        success: false,
        message: 'Restaurant name is required'
      });
    }

    // Check if user already has a restaurant with this name
    const user = await User.findById(req.user.id);
    const existingRestaurant = user.restaurants.find(
      restaurant => restaurant.name.toLowerCase() === name.toLowerCase()
    );

    if (existingRestaurant) {
      console.log(`[Auth] User already has a restaurant named ${name}`);
      return res.status(400).json({
        success: false,
        message: `You already have a restaurant named '${name}'`
      });
    }

    // Add restaurant to user's list
    console.log(`[Auth] Adding restaurant ${name} to user's list`);
    user.restaurants.push({
      name,
      description: description || '',
      location: location || ''
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Restaurant added successfully',
      data: user.restaurants
    });
    console.log(`[Auth] Restaurant ${name} added successfully to user's list`);
  } catch (error) {
    console.error(`[Auth] Error adding restaurant:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error adding restaurant'
    });
  }
};

/**
 * Get all user's restaurants
 * @route GET /api/auth/restaurants
 * @access Private
 */
export const getRestaurants = async (req, res) => {
  console.log(`[Auth] Getting user's restaurants at ${new Date().toISOString()}`);
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      count: user.restaurants.length,
      data: user.restaurants
    });
    console.log(`[Auth] Successfully retrieved ${user.restaurants.length} restaurants for user`);
  } catch (error) {
    console.error(`[Auth] Error getting restaurants:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting restaurants'
    });
  }
};

/**
 * Helper function to get token from model, create cookie and send response
 */
const sendTokenResponse = (user, statusCode, res, message) => {
  // Create token
  const token = user.getSignedJwtToken();

  // Create cookie options
  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // Use secure cookies in production
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // Remove password from response
  user.password = undefined;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      data: user
    });
};

export default {
  register,
  login,
  getMe,
  updateDetails,
  logout,
  addRestaurant,
  getRestaurants
}; 