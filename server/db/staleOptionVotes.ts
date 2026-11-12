import type { Client } from '@libsql/client'

/**
 * Option values the catalog offered before #27: prose descriptions of an option, not values
 * it accepts. Groups could vote for them then, and those votes would otherwise reach the
 * generated `.editorconfig` verbatim.
 */
const PROSE_OPTION_VALUES: { ruleId: string; optionName: string; value: string }[] = [
  {
    ruleId: 'IDE0036',
    optionName: 'csharp_preferred_modifier_order',
    value: 'One or more C# modifiers, such as public, private, and protected',
  },
  {
    ruleId: 'IDE0036',
    optionName: 'visual_basic_preferred_modifier_order',
    value: 'One or more Visual Basic modifiers, such as Partial, Private, and Public',
  },
  {
    ruleId: 'IDE0073',
    optionName: 'file_header_template',
    value: 'non-empty string, optionally containing a {fileName} placeholder',
  },
  { ruleId: 'IDE0073', optionName: 'file_header_template', value: 'unset or empty string' },
  {
    ruleId: 'IDE0079',
    optionName: 'dotnet_remove_unnecessary_suppression_exclusions',
    value: 'Comma-separated list of rule IDs or categories (prefixed with category:)',
  },
]

/**
 * Deletes option votes for the prose values above. Idempotent, so it runs on every start:
 * once they are gone it deletes nothing.
 */
export async function deleteProseOptionVotes(client: Client) {
  const results = await client.batch(
    PROSE_OPTION_VALUES.map(({ ruleId, optionName, value }) => ({
      sql: 'DELETE FROM option_votes WHERE rule_id = ? AND option_name = ? AND value = ?',
      args: [ruleId, optionName, value],
    })),
    'write',
  )
  const deleted = results.reduce((sum, r) => sum + r.rowsAffected, 0)
  if (deleted > 0) {
    console.info(`[db] Deleted ${deleted} option vote(s) for prose values the catalog no longer offers.`)
  }
}
