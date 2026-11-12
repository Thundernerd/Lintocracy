import { describe, expect, it } from 'vitest'
import type { MyVote, RuleOption, SeverityBreakdown } from '#shared/types/rule'
import { computeOptionTally, computeTally, deriveConsensus } from './consensus'

const option: RuleOption = {
  name: 'csharp_new_line_before_open_brace',
  defaultValue: 'all',
  values: [{ value: 'all' }, { value: 'none' }, { value: 'types' }],
}

function votes(...values: string[]) {
  return values.map((value) => ({ value }))
}

describe('computeOptionTally', () => {
  it('counts the votes for each value and makes the most-voted value the consensus', () => {
    expect(computeOptionTally('IDE0055', option, votes('none', 'all', 'none'))).toEqual({
      ruleId: 'IDE0055',
      optionName: 'csharp_new_line_before_open_brace',
      counts: { none: 2, all: 1 },
      total: 3,
      consensusValue: 'none',
    })
  })

  it('breaks a tie in favour of the documented default when it is one of the leaders', () => {
    const defaultTypes: RuleOption = { ...option, defaultValue: 'types' }
    const tally = computeOptionTally('IDE0055', defaultTypes, votes('types', 'all', 'none', 'all', 'types'))
    expect(tally.consensusValue).toBe('types')
  })

  it('breaks a tie between values other than the default by picking the alphabetically first', () => {
    // Documented out of alphabetical order, so neither documented nor voting order decides.
    const reordered: RuleOption = {
      ...option,
      values: [{ value: 'types' }, { value: 'none' }, { value: 'all' }],
    }
    const tally = computeOptionTally('IDE0055', reordered, votes('types', 'none', 'types', 'none'))
    expect(tally.consensusValue).toBe('none')
  })

  it('has no consensus when nobody has voted', () => {
    expect(computeOptionTally('IDE0055', option, [])).toEqual({
      ruleId: 'IDE0055',
      optionName: 'csharp_new_line_before_open_brace',
      counts: {},
      total: 0,
      consensusValue: null,
    })
  })
})

/** A severity breakdown with the given counts; unlisted severities are 0. */
function breakdown(counts: Partial<SeverityBreakdown> = {}): SeverityBreakdown {
  return { none: 0, suggestion: 0, warning: 0, error: 0, ...counts }
}

describe('deriveConsensus', () => {
  it('enables a rule when yes votes outnumber no votes', () => {
    expect(deriveConsensus(2, 1, breakdown({ warning: 2 }))).toEqual({
      consensusEnabled: true,
      consensusSeverity: 'warning',
    })
  })

  it('disables a rule when no votes outnumber yes votes', () => {
    expect(deriveConsensus(1, 2, breakdown({ warning: 1 })).consensusEnabled).toBe(false)
  })

  it("gives a disabled rule the severity 'none', whatever its yes voters chose", () => {
    expect(deriveConsensus(1, 3, breakdown({ error: 1 })).consensusSeverity).toBe('none')
  })

  it('leaves a yes/no tie disabled by default', () => {
    expect(deriveConsensus(2, 2, breakdown({ error: 2 })).consensusEnabled).toBe(false)
  })

  it("leaves a yes/no tie disabled when yesNoTie is 'exclude'", () => {
    const options = { yesNoTie: 'exclude' } as const
    expect(deriveConsensus(2, 2, breakdown({ error: 2 }), options).consensusEnabled).toBe(false)
  })

  it("enables a yes/no tie when yesNoTie is 'include'", () => {
    expect(deriveConsensus(2, 2, breakdown({ error: 2 }), { yesNoTie: 'include' })).toEqual({
      consensusEnabled: true,
      consensusSeverity: 'error',
    })
  })

  it("leaves a rule with no votes disabled even when yesNoTie is 'include'", () => {
    expect(deriveConsensus(0, 0, breakdown(), { yesNoTie: 'include' })).toEqual({
      consensusEnabled: false,
      consensusSeverity: 'none',
    })
  })

  it('gives an enabled rule its most-voted severity, even when a stronger one has votes', () => {
    const severities = breakdown({ suggestion: 3, warning: 1, error: 2 })
    expect(deriveConsensus(6, 0, severities).consensusSeverity).toBe('suggestion')
  })

  it('breaks a severity tie in favour of the strongest tied severity by default', () => {
    // error is tied with suggestion, not with the runner-up warning.
    const severities = breakdown({ suggestion: 2, warning: 1, error: 2 })
    expect(deriveConsensus(5, 0, severities).consensusSeverity).toBe('error')
  })

  it("breaks a severity tie in favour of the strongest tied severity when severityTie is 'highest'", () => {
    const severities = breakdown({ suggestion: 2, warning: 2, error: 1 })
    expect(deriveConsensus(5, 0, severities, { severityTie: 'highest' }).consensusSeverity).toBe('warning')
  })

  it("breaks a severity tie in favour of the weakest tied severity when severityTie is 'lowest'", () => {
    const severities = breakdown({ suggestion: 1, warning: 2, error: 2 })
    expect(deriveConsensus(5, 0, severities, { severityTie: 'lowest' }).consensusSeverity).toBe('warning')
  })

  it("gives an enabled rule with no severity votes the severity 'suggestion'", () => {
    expect(deriveConsensus(1, 0, breakdown())).toEqual({
      consensusEnabled: true,
      consensusSeverity: 'suggestion',
    })
  })
})

describe('computeTally', () => {
  it('counts yes, no and total votes, and builds the severity breakdown from yes votes only', () => {
    const tally = computeTally({ id: 'CA1822' }, [
      { vote: 'yes', severity: 'warning' },
      { vote: 'no', severity: 'error' },
      { vote: 'yes', severity: 'warning' },
      { vote: 'no', severity: null },
      { vote: 'yes', severity: 'error' },
    ])
    expect(tally).toEqual({
      ruleId: 'CA1822',
      yes: 3,
      no: 2,
      total: 5,
      severityBreakdown: { none: 0, suggestion: 0, warning: 2, error: 1 },
      consensusEnabled: true,
      consensusSeverity: 'warning',
    })
  })

  it("counts a yes vote with no severity as 'suggestion'", () => {
    const tally = computeTally({ id: 'CA1822' }, [
      { vote: 'yes', severity: null },
      { vote: 'yes', severity: null },
      { vote: 'yes', severity: 'error' },
    ])
    expect(tally.severityBreakdown).toEqual({ none: 0, suggestion: 2, warning: 0, error: 1 })
    expect(tally.consensusSeverity).toBe('suggestion')
  })

  it('passes the tie-break options on to the consensus', () => {
    // A yes/no tie whose yes voters are split between warning and error.
    const votes: Pick<MyVote, 'vote' | 'severity'>[] = [
      { vote: 'yes', severity: 'warning' },
      { vote: 'yes', severity: 'error' },
      { vote: 'no', severity: null },
      { vote: 'no', severity: null },
    ]
    const tally = computeTally({ id: 'CA1822' }, votes, { yesNoTie: 'include', severityTie: 'lowest' })
    expect(tally.consensusEnabled).toBe(true)
    expect(tally.consensusSeverity).toBe('warning')
  })
})
