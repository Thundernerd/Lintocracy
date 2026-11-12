import { describe, expect, it } from 'vitest'
import { normaliseListValue } from './optionValue'

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
