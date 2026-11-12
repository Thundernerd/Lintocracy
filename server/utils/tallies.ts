import { eq } from 'drizzle-orm'
import type { MyVote, RuleTally } from '#shared/types/rule'
import { computeTally, type ConsensusOptions } from '#shared/utils/consensus'
import { useDb } from '../db'
import { votes } from '../db/schema'
import { rules } from '../data/rules'

/** Loads a group's votes and computes a tally per rule in the dataset. */
export async function buildAllTallies(
  groupId: string,
  options?: ConsensusOptions,
): Promise<RuleTally[]> {
  const db = await useDb()
  const rows = await db
    .select({ ruleId: votes.ruleId, vote: votes.vote, severity: votes.severity })
    .from(votes)
    .where(eq(votes.groupId, groupId))

  const byRule = new Map<string, Pick<MyVote, 'vote' | 'severity'>[]>()
  for (const row of rows) {
    const list = byRule.get(row.ruleId) ?? []
    list.push({ vote: row.vote, severity: row.severity })
    byRule.set(row.ruleId, list)
  }

  return rules.map((rule) => computeTally(rule, byRule.get(rule.id) ?? [], options))
}
