import express from 'express';
import {
  register,
  login,
  getMe,
  updateDetails,
  logout,
  addRestaurant,
  getRestaurants
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.use(protect);
router.get('/me', getMe);
router.put('/updatedetails', updateDetails);
router.post('/logout', logout);
router.route('/restaurants')
  .get(getRestaurants)
  .post(addRestaurant);

export default router; 