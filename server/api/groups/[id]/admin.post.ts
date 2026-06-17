import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { useDb } from '../../../db'
import { groups } from '../../../db/schema'
import { verifyPassword } from '../../../utils/password'
import { grantAdmin } from '../../../utils/groupAdmin'

const bodySchema = z.object({ password: z.string().min(1) })

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Password required' })
  }

  const db = useDb()
  const [group] = await db.select().from(groups).where(eq(groups.id, id)).limit(1)
  if (!group) {
    throw createError({ statusCode: 404, statusMessage: 'Group not found' })
  }

  if (!verifyPassword(parsed.data.password, group.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: 'Incorrect password' })
  }

  grantAdmin(event, id)
  return { ok: true, inviteToken: group.inviteToken }
})
