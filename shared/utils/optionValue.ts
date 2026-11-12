import type { RuleOption } from '#shared/types/rule'

/**
 * Whether voters may type their own value for an option: it documents no
 * values (IDE0036's modifier order), or its documented values are only some
 * of the accepted ones (`freeForm`, e.g. IDE0079's list of rule IDs).
 */
export function acceptsTypedValues(option: RuleOption): boolean {
  return !option.values?.length || !!option.freeForm
}

/**
 * Why a typed option value cannot go on an `.editorconfig` line, or null when
 * it can once trimmed. A newline would split the line, and Roslyn reads `#`
 * or `;` as the start of a comment, cutting the value short.
 */
export function typedOptionValueError(value: string): string | null {
  if (/[\r\n]/.test(value)) return 'Value must be on a single line'
  if (/[#;]/.test(value)) return 'Value must not contain # or ;'
  if (!value.trim()) return 'Value must not be empty'
  return null
}

/**
 * A comma-separated list value in one canonical spelling, so values that read
 * the same to Roslyn (`public,private` and `public, private`) are tallied as
 * one: each item trimmed, empty items dropped, rejoined with `, `.
 */
export function normaliseListValue(value: string): string {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ')
}

/** A typed option value as it is stored and tallied: trimmed, and a list normalised. */
export function normaliseOptionValue(option: RuleOption, value: string): string {
  return option.listValue ? normaliseListValue(value) : value.trim()
}
