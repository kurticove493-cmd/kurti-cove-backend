/**
 * sendOtpMail — sends OTP via Brevo API.
 * Always logs OTP to console as backup (visible in Render logs).
 */
import { sendOTPEmail } from '../services/emailService.js'

export const sendOtpMail = async (toEmail, otp) => {
  // Always log — visible in Render logs as fallback
  console.log(`🔐 OTP for ${toEmail}: ${otp}`)

  if (!process.env.BREVO_API_KEY) {
    console.warn('⚠️  BREVO_API_KEY not set — email skipped.')
    return
  }

  try {
    await sendOTPEmail(toEmail, otp)
    console.log(`✅  OTP email sent to ${toEmail}`)
  } catch (err) {
    console.error(`❌  OTP email failed: ${err.message}`)
    // Don't throw — registration still succeeds
  }
}
