import { describe, expect, it } from 'vitest'
import type { RuleOption } from '#shared/types/rule'
import { computeOptionTally } from './consensus'

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
