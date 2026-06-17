import type { SeverityTieBreak, YesNoTieBreak } from '#shared/utils/consensus'
import { generateEditorConfig } from '#shared/utils/editorconfig'
import { buildAllTallies } from '../utils/tallies'
import { buildAllOptionTallies } from '../utils/optionTallies'
import { requireGroupFromQuery } from '../utils/group'
import { rules } from '../data/rules'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const includeUnvoted = query.includeUnvoted === 'true'
  const useMsDefaults = query.useMsDefaults === 'true'
  const download = query.download === 'true'
  const yesNoTie: YesNoTieBreak = query.yesNoTie === 'include' ? 'include' : 'exclude'
  const severityTie: SeverityTieBreak = query.severityTie === 'lowest' ? 'lowest' : 'highest'
  const groupId = await requireGroupFromQuery(event)

  const [tallies, optionTallies] = await Promise.all([
    buildAllTallies(groupId, { yesNoTie, severityTie }),
    buildAllOptionTallies(groupId),
  ])
  const content = generateEditorConfig(rules, tallies, {
    includeUnvoted,
    useMsDefaults,
    optionTallies,
  })

  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  if (download) {
    setResponseHeader(event, 'Content-Disposition', 'attachment; filename=".editorconfig"')
  }
  return content
})
