import express from 'express'
import {
  placeOrder,
  getMyOrders,
  getOrderStats,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getAllOrders,
  confirmPayment,
  rejectPayment,
} from '../controllers/OrderController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// Protected user routes
router.post('/place', protect, placeOrder)
router.get('/my-orders', protect, getMyOrders)
router.get('/stats', protect, getOrderStats)
router.get('/:id', protect, getOrderById)
router.patch('/cancel/:id', protect, cancelOrder)

// Admin routes
router.get('/admin/all', protect, authorize('admin', 'superAdmin'), getAllOrders)
router.patch('/admin/status/:id', protect, authorize('admin', 'superAdmin'), updateOrderStatus)
router.patch('/admin/confirm-payment/:id', protect, authorize('admin', 'superAdmin'), confirmPayment)
router.patch('/admin/reject-payment/:id', protect, authorize('admin', 'superAdmin'), rejectPayment)

export default router
