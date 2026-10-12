/**
 * seedAdmin.js
 * Creates a default superAdmin account if none exists in the DB.
 * Called automatically when the server starts.
 *
 * Credentials are read from env vars:
 *   ADMIN_EMAIL    (default: admin@kurticove.com)
 *   ADMIN_PASSWORD (default: Admin@123)
 *   ADMIN_NAME     (default: Super Admin)
 */

import Cryptr from 'cryptr'
import UserModel from '../models/UserModel.js'

export const seedAdmin = async () => {
  try {
    const email    = process.env.ADMIN_EMAIL    || 'admin@kurticove.com'
    const password = process.env.ADMIN_PASSWORD || 'Admin@123'
    const name     = process.env.ADMIN_NAME     || 'Super Admin'

    const existing = await UserModel.findOne({ email: email.toLowerCase() })
    if (existing) {
      // Already exists — silently skip
      return
    }

    if (!process.env.CRYPTR_SECRET) {
      console.warn('⚠️  seedAdmin: CRYPTR_SECRET not set, skipping admin seed.')
      return
    }

    const cryptr = new Cryptr(process.env.CRYPTR_SECRET)
    const encryptedPassword = cryptr.encrypt(password)

    await UserModel.create({
      name,
      email: email.toLowerCase(),
      password: encryptedPassword,
      role: 'superAdmin',
      isVerified: true,
    })

    console.log(`✅  Default admin created → ${email} / ${password}`)
    console.log(`    ⚠️  Change this password after first login!`)
  } catch (err) {
    console.error('seedAdmin error:', err.message)
  }
}
