import express from 'express';
import { 
  getCustomers, 
  getCustomerStats, 
  createCustomer, 
  getCustomerById, 
  updateCustomer, 
  deleteCustomer, 
  getMyJobs,
  addPayment
} from '../controllers/customerController.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Admin only routes
router.get('/', auth, requireRole('admin'), getCustomers);
router.get('/stats', auth, requireRole('admin'), getCustomerStats);
router.post('/', auth, requireRole('admin'), createCustomer);
router.post('/:id/payments', auth, requireRole('admin'), addPayment);
router.delete('/:id', auth, requireRole('admin'), deleteCustomer);

// Protected routes for both admin and customers
router.get('/:id', auth, getCustomerById);
router.put('/:id', auth, updateCustomer);

// Customer specific routes
router.get('/me/jobs', auth, requireRole('customer'), getMyJobs);

export default router;