import { eq, sql } from 'drizzle-orm'
import type { GroupContext } from '#shared/types/group'
import { useDb } from '../../../db'
import { groups, members } from '../../../db/schema'
import { getMemberCookie } from '../../../utils/membership'
import { isAdmin } from '../../../utils/groupAdmin'

export default defineEventHandler(async (event): Promise<GroupContext> => {
  const id = getRouterParam(event, 'id')!
  const db = useDb()

  const [group] = await db.select().from(groups).where(eq(groups.id, id)).limit(1)
  if (!group) {
    throw createError({ statusCode: 404, statusMessage: 'Group not found' })
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(members)
    .where(eq(members.groupId, id))

  const memberId = getMemberCookie(event, id)
  let me: GroupContext['me'] = null
  if (memberId) {
    const [row] = await db
      .select({ id: members.id, name: members.name })
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1)
    if (row && row.id) me = { id: row.id, name: row.name }
  }

  const admin = isAdmin(event, id)

  return {
    id: group.id,
    name: group.name,
    memberCount: Number(count),
    me,
    isAdmin: admin,
    inviteToken: admin ? group.inviteToken : undefined,
  }
})
