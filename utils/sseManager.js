/**
 * sseManager.js
 * Lightweight Server-Sent Events broadcast for admin UPI alerts.
 *
 * - Stores authenticated admin SSE connections in a Map keyed by userId.
 * - Multiple tabs/devices per admin are supported (value = Set of res objects).
 * - No external dependencies — pure Node/Express.
 * - Render free tier: connections may drop on spin-down; clients reconnect automatically.
 */

// Map<userId:string, Set<res>>
const adminClients = new Map()

/**
 * Register a new SSE response for an admin.
 * @param {string} userId
 * @param {import('express').Response} res
 */
export function addAdminClient(userId, res) {
  if (!adminClients.has(userId)) {
    adminClients.set(userId, new Set())
  }
  adminClients.get(userId).add(res)
  console.log(`📡 SSE: admin ${userId} connected (${countTotal()} total connections)`)
}

/**
 * Remove a specific SSE response for an admin.
 * @param {string} userId
 * @param {import('express').Response} res
 */
export function removeAdminClient(userId, res) {
  const set = adminClients.get(userId)
  if (!set) return
  set.delete(res)
  if (set.size === 0) adminClients.delete(userId)
  console.log(`📡 SSE: admin ${userId} disconnected (${countTotal()} total connections)`)
}

/**
 * Broadcast a JSON event to ALL connected admin clients.
 * @param {string} eventType  — SSE event name
 * @param {object} data       — JSON-serialisable payload
 */
export function broadcastToAdmins(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
  let sent = 0
  for (const [, connections] of adminClients) {
    for (const res of connections) {
      try {
        res.write(payload)
        sent++
      } catch (err) {
        console.error('SSE write error:', err.message)
      }
    }
  }
  if (sent > 0) {
    console.log(`📡 SSE: broadcast "${eventType}" to ${sent} admin connection(s)`)
  }
}

function countTotal() {
  let n = 0
  for (const [, s] of adminClients) n += s.size
  return n
}
