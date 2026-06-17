import type { OptionTally } from '#shared/types/rule'
import { buildAllOptionTallies } from '../../utils/optionTallies'
import { requireGroupFromQuery } from '../../utils/group'

export default defineEventHandler(async (event): Promise<OptionTally[]> => {
  const groupId = await requireGroupFromQuery(event)
  return buildAllOptionTallies(groupId)
})
