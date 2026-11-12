import { describe, expect, it } from 'vitest'
import type { RuleOption } from '#shared/types/rule'
import {
  isAcceptedOptionValue,
  isDocumentedOptionValue,
  normaliseListValue,
  normaliseOptionValue,
  typedOptionValueError,
} from './optionValue'

const enumerated: RuleOption = {
  name: 'csharp_style_var_for_built_in_types',
  values: [{ value: 'true' }, { value: 'false' }],
}

describe('isDocumentedOptionValue', () => {
  it('is true for one of the option\'s documented values', () => {
    expect(isDocumentedOptionValue(enumerated, 'false')).toBe(true)
  })

  it('is false for a value the option does not document, even one a free-form option accepts', () => {
    const option: RuleOption = { ...enumerated, freeForm: true }
    expect(isDocumentedOptionValue(option, 'maybe')).toBe(false)
  })

  it('is false for any value on an option that documents no values', () => {
    expect(isDocumentedOptionValue({ name: 'file_header_template' }, 'true')).toBe(false)
  })
})

describe('isAcceptedOptionValue', () => {
  it('accepts a documented value of an enumerated option', () => {
    expect(isAcceptedOptionValue(enumerated, 'true')).toBe(true)
  })

  it('rejects an off-catalog value on an enumerated option', () => {
    expect(isAcceptedOptionValue(enumerated, 'maybe')).toBe(false)
  })

  it('accepts any value on an option that documents no values', () => {
    const option: RuleOption = { name: 'csharp_preferred_modifier_order' }
    expect(isAcceptedOptionValue(option, 'public, private')).toBe(true)
  })

  it('accepts an undocumented value on a free-form option', () => {
    const option: RuleOption = {
      name: 'dotnet_remove_unnecessary_suppression_exclusions',
      values: [{ value: 'none' }, { value: 'all' }],
      freeForm: true,
    }
    expect(isAcceptedOptionValue(option, 'IDE0005, CA1822')).toBe(true)
  })
})

describe('typedOptionValueError', () => {
  it('rejects a value that spans more than one line', () => {
    expect(typedOptionValueError('public\nprivate')).toBe('Value must be on a single line')
    expect(typedOptionValueError('public\rprivate')).toBe('Value must be on a single line')
  })

  it('rejects a value containing a comment character', () => {
    expect(typedOptionValueError('IDE0005 # unused')).toBe('Value must not contain # or ;')
    expect(typedOptionValueError('IDE0005; CA1822')).toBe('Value must not contain # or ;')
  })

  it('rejects an empty or blank value', () => {
    expect(typedOptionValueError('')).toBe('Value must not be empty')
    expect(typedOptionValueError('   ')).toBe('Value must not be empty')
  })

  it('accepts an ordinary value', () => {
    expect(typedOptionValueError('public, private, static')).toBeNull()
  })
})

describe('normaliseListValue', () => {
  it('trims each item of a comma-separated list and rejoins them with ", "', () => {
    expect(normaliseListValue('public ,private,  static')).toBe('public, private, static')
  })

  it('leaves a single item unchanged', () => {
    expect(normaliseListValue('public')).toBe('public')
  })

  it('drops empty items left by a trailing or doubled comma', () => {
    expect(normaliseListValue('public,, private,')).toBe('public, private')
  })
})

describe('normaliseOptionValue', () => {
  it('normalises the value of a list option', () => {
    const option = { name: 'csharp_preferred_modifier_order', listValue: true }
    expect(normaliseOptionValue(option, ' public,private ')).toBe('public, private')
  })

  it('keeps the value of any other option as typed, trimmed only', () => {
    const option = { name: 'file_header_template' }
    expect(normaliseOptionValue(option, ' Copyright a,b ')).toBe('Copyright a,b')
  })
})
