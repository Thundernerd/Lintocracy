import { describe, expect, it } from 'vitest'
import { normaliseListValue, normaliseOptionValue } from './optionValue'

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
