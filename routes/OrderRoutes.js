import express from 'express'
import jwt from 'jsonwebtoken'
import UserModel from '../models/UserModel.js'
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
import { addAdminClient, removeAdminClient } from '../utils/sseManager.js'

const router = express.Router()

// ── Admin SSE stream — authenticated via ?token= query param ──────────────
// Browsers cannot set custom headers on EventSource, so JWT travels in ?token.
router.get('/admin/sse', async (req, res) => {
  try {
    // Authenticate via query token (EventSource cannot send Authorization headers)
    const token = req.query.token
    if (!token) return res.status(401).json({ success: false, msg: 'No token.' })

    let decoded
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY)
    } catch {
      return res.status(401).json({ success: false, msg: 'Invalid token.' })
    }

    const user = await UserModel.findById(decoded.id).select('role isVerified')
    if (!user || !user.isVerified || !['admin', 'superAdmin'].includes(user.role)) {
      return res.status(403).json({ success: false, msg: 'Admin access required.' })
    }

    const userId = String(user._id)

    // SSE headers — disable compression for this route
    res.setHeader('Content-Type',  'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection',    'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no') // Nginx/Render proxy
    res.flushHeaders()

    // Send a heartbeat immediately to confirm connection
    res.write('event: connected\ndata: {"status":"ok"}\n\n')

    // Heartbeat every 25 s to prevent proxy timeouts
    const heartbeat = setInterval(() => {
      try { res.write(': heartbeat\n\n') } catch { clearInterval(heartbeat) }
    }, 25000)

    addAdminClient(userId, res)

    req.on('close', () => {
      clearInterval(heartbeat)
      removeAdminClient(userId, res)
    })
  } catch (err) {
    console.error('SSE setup error:', err.message)
    if (!res.headersSent) res.status(500).end()
  }
})

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
