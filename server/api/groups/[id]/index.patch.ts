import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { useDb } from '../../../db'
import { groups } from '../../../db/schema'
import { requireAdmin } from '../../../utils/groupAdmin'

const bodySchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(80),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  requireAdmin(event, id)

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid name',
      message: z.prettifyError(parsed.error),
    })
  }

  const db = await useDb()
  const result = await db
    .update(groups)
    .set({ name: parsed.data.name })
    .where(eq(groups.id, id))
    .returning({ id: groups.id, name: groups.name })

  if (!result.length) {
    throw createError({ statusCode: 404, statusMessage: 'Group not found' })
  }

  return result[0]
})
