import type {
  MyVote,
  OptionTally,
  Rule,
  RuleOption,
  RuleTally,
  Severity,
  SeverityBreakdown,
} from '#shared/types/rule'

export function emptyBreakdown(): SeverityBreakdown {
  return { none: 0, suggestion: 0, warning: 0, error: 0 }
}

/** Severities ranked from weakest to strongest, used for tie-breaking. */
const SEVERITY_RANK: Severity[] = ['none', 'suggestion', 'warning', 'error']

/** How to resolve a rule when "yes" and "no" votes are tied. */
export type YesNoTieBreak = 'exclude' | 'include'

/** Which severity to pick when several severities tie for the most votes. */
export type SeverityTieBreak = 'highest' | 'lowest'

export interface ConsensusOptions {
  /**
   * What to do when "yes" and "no" votes are tied (and at least one vote was
   * cast). `'exclude'` leaves the rule off; `'include'` enables it.
   */
  yesNoTie?: YesNoTieBreak
  /**
   * When no single severity has the most votes, pick the `'highest'`
   * (strongest, e.g. error) or `'lowest'` (weakest, e.g. suggestion) of the
   * tied severities — by rank, not by vote count.
   */
  severityTie?: SeverityTieBreak
}

export const DEFAULT_CONSENSUS_OPTIONS: Required<ConsensusOptions> = {
  yesNoTie: 'exclude',
  severityTie: 'highest',
}

/**
 * Resolves whether a rule is enabled and at what severity, from its tallied
 * counts. Pure and side-effect free so it can be re-run on the client whenever
 * the user changes the tie-breaking options.
 */
export function deriveConsensus(
  yes: number,
  no: number,
  breakdown: SeverityBreakdown,
  options?: ConsensusOptions,
): { consensusEnabled: boolean; consensusSeverity: Severity } {
  const { yesNoTie, severityTie } = { ...DEFAULT_CONSENSUS_OPTIONS, ...options }

  let consensusEnabled: boolean
  if (yes > no) consensusEnabled = true
  else if (yes < no) consensusEnabled = false
  // A tie only counts when at least one vote was cast (0–0 stays disabled).
  else consensusEnabled = yes > 0 && yesNoTie === 'include'

  return {
    consensusEnabled,
    consensusSeverity: consensusEnabled ? pickSeverity(breakdown, severityTie) : 'none',
  }
}

/**
 * Computes the group consensus for a rule from raw vote rows.
 *
 * - Enabled when "yes" votes outnumber "no" votes (ties resolved per options).
 * - Severity is the most-voted severity among "yes" voters; severity ties are
 *   resolved per options (highest/lowest ranked).
 */
export function computeTally(
  rule: Pick<Rule, 'id'>,
  votes: Pick<MyVote, 'vote' | 'severity'>[],
  options?: ConsensusOptions,
): RuleTally {
  const breakdown = emptyBreakdown()
  let yes = 0
  let no = 0

  for (const v of votes) {
    if (v.vote === 'yes') {
      yes++
      const sev = v.severity ?? 'suggestion'
      breakdown[sev]++
    } else {
      no++
    }
  }

  const { consensusEnabled, consensusSeverity } = deriveConsensus(yes, no, breakdown, options)

  return {
    ruleId: rule.id,
    yes,
    no,
    total: yes + no,
    severityBreakdown: breakdown,
    consensusEnabled,
    consensusSeverity,
  }
}

/**
 * Computes the consensus value for one configurable option of a rule.
 *
 * The winner is the most-voted value. Ties are broken in favour of the rule's
 * documented default value when it is among the leaders, otherwise the
 * lexicographically first value wins for determinism.
 */
export function computeOptionTally(
  ruleId: string,
  option: RuleOption,
  votes: { value: string }[],
): OptionTally {
  const { name: optionName, defaultValue } = option
  const counts: Record<string, number> = {}
  for (const v of votes) {
    counts[v.value] = (counts[v.value] ?? 0) + 1
  }

  const total = votes.length
  let consensusValue: string | null = null

  if (total > 0) {
    const max = Math.max(...Object.values(counts))
    const leaders = Object.keys(counts)
      .filter((value) => counts[value] === max)
      .sort()
    consensusValue =
      defaultValue && leaders.includes(defaultValue) ? defaultValue : leaders[0]!
  }

  return { ruleId, optionName, counts, total, consensusValue }
}

function pickSeverity(breakdown: SeverityBreakdown, tie: SeverityTieBreak): Severity {
  // Candidate severities ranked weakest -> strongest (excluding "none").
  const ranked = SEVERITY_RANK.filter((s) => s !== 'none')
  const max = Math.max(...ranked.map((s) => breakdown[s]))
  if (max <= 0) return 'suggestion'

  // Leaders are kept in rank order, so the first is the weakest and the last
  // the strongest. On a tie we pick whichever end the option asks for.
  const leaders = ranked.filter((s) => breakdown[s] === max)
  return tie === 'highest' ? leaders[leaders.length - 1]! : leaders[0]!
}
