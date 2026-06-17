import { asc, eq } from 'drizzle-orm'
import type { GroupMember } from '#shared/types/group'
import { useDb } from '../../../db'
import { members } from '../../../db/schema'

export default defineEventHandler(async (event): Promise<GroupMember[]> => {
  const id = getRouterParam(event, 'id')!
  const db = useDb()

  const rows = await db
    .select({ id: members.id, name: members.name, createdAt: members.createdAt })
    .from(members)
    .where(eq(members.groupId, id))
    .orderBy(asc(members.createdAt))

  return rows
})
