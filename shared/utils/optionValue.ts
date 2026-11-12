import type { RuleOption } from '#shared/types/rule'

/**
 * Whether voters may type their own value for an option: it documents no
 * values (IDE0036's modifier order), or its documented values are only some
 * of the accepted ones (`freeForm`, e.g. IDE0079's list of rule IDs).
 */
export function acceptsTypedValues(option: RuleOption): boolean {
  return !option.values?.length || !!option.freeForm
}

/** Whether a value is one of the option's documented values. */
export function isDocumentedOptionValue(option: RuleOption, value: string): boolean {
  return !!option.values?.some((v) => v.value === value)
}

/**
 * Whether an option accepts a value: any value when voters may type their own,
 * otherwise only one of its documented values.
 */
export function isAcceptedOptionValue(option: RuleOption, value: string): boolean {
  return acceptsTypedValues(option) || isDocumentedOptionValue(option, value)
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
