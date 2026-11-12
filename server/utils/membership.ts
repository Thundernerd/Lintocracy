import { and, eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { useDb } from '../db'
import { members } from '../db/schema'

const ONE_YEAR = 60 * 60 * 24 * 365
const ACTIVE_GROUP_COOKIE = 'cv_active_group'

const memberCookieName = (groupId: string) => `cv_member_${groupId}`

/** Stores the member id for a group and marks it as the active group. */
export function setMembership(event: H3Event, groupId: string, memberId: string) {
  setCookie(event, memberCookieName(groupId), memberId, {
    maxAge: ONE_YEAR,
    path: '/',
    sameSite: 'lax',
    // Readable by client code; this is a low-stakes anonymous member id.
    httpOnly: false,
  })
  setActiveGroup(event, groupId)
}

export function setActiveGroup(event: H3Event, groupId: string) {
  setCookie(event, ACTIVE_GROUP_COOKIE, groupId, {
    maxAge: ONE_YEAR,
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
  })
}

/** Returns the member id cookie for a group, if present (no DB check). */
export function getMemberCookie(event: H3Event, groupId: string): string | undefined {
  return getCookie(event, memberCookieName(groupId))
}

/**
 * Resolves the current member id for a group, verifying the cookie maps to a
 * real member row. Throws 403 when the browser is not a member of the group.
 */
export async function getMemberId(event: H3Event, groupId: string): Promise<string> {
  const memberId = getMemberCookie(event, groupId)
  if (memberId) {
    const db = await useDb()
    const found = await db
      .select({ id: members.id })
      .from(members)
      .where(and(eq(members.id, memberId), eq(members.groupId, groupId)))
      .limit(1)
    if (found.length) return memberId
  }
  throw createError({ statusCode: 403, statusMessage: 'Join this group to vote' })
}
