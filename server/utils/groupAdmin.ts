import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

const ONE_YEAR = 60 * 60 * 24 * 365

const adminCookieName = (groupId: string) => `cv_admin_${groupId}`

/** Deterministic signed token proving admin rights for a group. */
function adminToken(groupId: string): string {
  const secret = useRuntimeConfig().adminSecret as string
  return createHmac('sha256', secret).update(groupId).digest('hex')
}

/** Marks this browser as an admin of the group via a signed httpOnly cookie. */
export function grantAdmin(event: H3Event, groupId: string) {
  setCookie(event, adminCookieName(groupId), adminToken(groupId), {
    maxAge: ONE_YEAR,
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
  })
}

/** Returns true when the request carries a valid admin cookie for the group. */
export function isAdmin(event: H3Event, groupId: string): boolean {
  const token = getCookie(event, adminCookieName(groupId))
  if (!token) return false
  const expected = adminToken(groupId)
  const a = Buffer.from(token)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Throws 403 unless the request is an admin of the group. */
export function requireAdmin(event: H3Event, groupId: string) {
  if (!isAdmin(event, groupId)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }
}
