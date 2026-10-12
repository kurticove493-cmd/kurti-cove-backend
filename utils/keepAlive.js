/**
 * keepAlive.js
 * Pings the Render backend every 14 minutes to prevent it from
 * spinning down on the free tier (which sleeps after 15 min of inactivity).
 *
 * Only runs in production (NODE_ENV=production).
 * Reads RENDER_URL from env — set it to your Render service URL,
 * e.g. https://kurti-cove-api.onrender.com
 */

const INTERVAL_MS = 14 * 60 * 1000 // 14 minutes

export const startKeepAlive = () => {
  const url = process.env.RENDER_URL

  if (process.env.NODE_ENV !== 'production') {
    console.log('ℹ️   Keep-alive disabled in development mode.')
    return
  }

  if (!url) {
    console.warn('⚠️   RENDER_URL not set — keep-alive ping disabled.')
    return
  }

  const ping = async () => {
    try {
      const res = await fetch(`${url}/api/health`)
      if (res.ok) {
        console.log(`🏓  Keep-alive ping → ${url}/api/health [${res.status}]`)
      } else {
        console.warn(`⚠️   Keep-alive ping returned status ${res.status}`)
      }
    } catch (err) {
      console.error(`❌  Keep-alive ping failed: ${err.message}`)
    }
  }

  setInterval(ping, INTERVAL_MS)
  console.log(`🏓  Keep-alive started — pinging every 14 min → ${url}`)
}
