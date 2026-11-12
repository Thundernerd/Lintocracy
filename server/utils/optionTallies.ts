import { eq } from 'drizzle-orm'
import type { OptionTally } from '#shared/types/rule'
import { computeOptionTally } from '#shared/utils/consensus'
import { useDb } from '../db'
import { optionVotes } from '../db/schema'
import { rules } from '../data/rules'

const optionKey = (ruleId: string, optionName: string) => `${ruleId}::${optionName}`

/** Loads a group's option votes and computes a tally per documented option. */
export async function buildAllOptionTallies(groupId: string): Promise<OptionTally[]> {
  const db = await useDb()
  const rows = await db
    .select({ ruleId: optionVotes.ruleId, optionName: optionVotes.optionName, value: optionVotes.value })
    .from(optionVotes)
    .where(eq(optionVotes.groupId, groupId))

  const byOption = new Map<string, { value: string }[]>()
  for (const row of rows) {
    const key = optionKey(row.ruleId, row.optionName)
    const list = byOption.get(key) ?? []
    list.push({ value: row.value })
    byOption.set(key, list)
  }

  const tallies: OptionTally[] = []
  for (const rule of rules) {
    for (const opt of rule.options ?? []) {
      tallies.push(
        computeOptionTally(
          rule.id,
          opt.name,
          opt.defaultValue,
          byOption.get(optionKey(rule.id, opt.name)) ?? [],
        ),
      )
    }
  }
  return tallies
}
