import { eq, sql } from 'drizzle-orm'
import type { GroupSummary } from '#shared/types/group'
import { useDb } from '../../../db'
import { groups, members } from '../../../db/schema'

export default defineEventHandler(async (event): Promise<GroupSummary> => {
  const token = getRouterParam(event, 'token')!
  const db = useDb()

  const [group] = await db
    .select({ id: groups.id, name: groups.name })
    .from(groups)
    .where(eq(groups.inviteToken, token))
    .limit(1)

  if (!group) {
    throw createError({ statusCode: 404, statusMessage: 'Invite not found' })
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(members)
    .where(eq(members.groupId, group.id))

  return { id: group.id, name: group.name, memberCount: Number(count) }
})
