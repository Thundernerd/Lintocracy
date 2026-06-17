import type { RuleTally } from '#shared/types/rule'
import { buildAllTallies } from '../../utils/tallies'
import { requireGroupFromQuery } from '../../utils/group'

export default defineEventHandler(async (event): Promise<RuleTally[]> => {
  const groupId = await requireGroupFromQuery(event)
  return buildAllTallies(groupId)
})
