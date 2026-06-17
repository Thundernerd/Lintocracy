import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { useDb } from '../db'
import { groups } from '../db/schema'

/** Validates that a group exists, throwing 404 otherwise. */
export async function assertGroupExists(groupId: string) {
  const db = useDb()
  const [row] = await db.select({ id: groups.id }).from(groups).where(eq(groups.id, groupId)).limit(1)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Group not found' })
  }
}

/** Reads `groupId` from the query string and validates it exists. */
export async function requireGroupFromQuery(event: H3Event): Promise<string> {
  const groupId = getQuery(event).groupId
  if (typeof groupId !== 'string' || !groupId) {
    throw createError({ statusCode: 400, statusMessage: 'groupId is required' })
  }
  await assertGroupExists(groupId)
  return groupId
}
