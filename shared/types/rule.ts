export type Severity = 'none' | 'suggestion' | 'warning' | 'error'

export const SEVERITIES: Severity[] = ['none', 'suggestion', 'warning', 'error']

export type RuleCategory = 'style' | 'quality'

export type VoteChoice = 'yes' | 'no'

export interface RuleExample {
  bad?: string
  good?: string
}

export interface EditorConfigOption {
  key: string
  value: string
}

export interface RuleEditorConfig {
  /** Diagnostic id used for `dotnet_diagnostic.<id>.severity`. */
  diagnosticId: string
  /** Style-rule option lines (e.g. `csharp_prefer_braces = true`). */
  options?: EditorConfigOption[]
}

export interface RuleOptionValue {
  value: string
  description?: string
}

/** A configurable .editorconfig option documented for a rule. */
export interface RuleOption {
  name: string
  defaultValue?: string
  /** Documented literal values. Absent when the docs only describe the values in prose. */
  values?: RuleOptionValue[]
  /** True when the option lists `values` but also accepts other values (e.g. a list of rule IDs). */
  freeForm?: boolean
}

export type SeverityBreakdown = Record<Severity, number>

export interface RuleTally {
  ruleId: string
  yes: number
  no: number
  total: number
  /** Distribution of chosen severities among "yes" votes. */
  severityBreakdown: SeverityBreakdown
  /** Majority of "yes" over "no". */
  consensusEnabled: boolean
  /** Resulting severity: most-voted among yes voters, or `none` when disabled. */
  consensusSeverity: Severity
}

export interface MyVote {
  ruleId: string
  vote: VoteChoice
  severity: Severity | null
}

/** A single voter's choice for a configurable option of a rule. */
export interface OptionVote {
  ruleId: string
  optionName: string
  value: string
}

/** Aggregated votes for one configurable option of a rule. */
export interface OptionTally {
  ruleId: string
  optionName: string
  /** Number of votes per option value. */
  counts: Record<string, number>
  total: number
  /** Most-voted value (documented default wins ties); null when no votes. */
  consensusValue: string | null
}

export interface Rule {
  id: string
  title: string
  category: RuleCategory
  group: string
  summary: string
  /** Description (curated, or imported from the rule's docs page). */
  description?: string
  /** Curated rationale. May be absent for auto-imported rules. */
  whyItMatters?: string
  /** Curated good/bad examples. May be absent for auto-imported rules. */
  examples?: RuleExample
  docsUrl: string
  defaultSeverity: Severity
  supportsSeverity: boolean
  editorconfig: RuleEditorConfig
  /** True for the hand-curated rules with rich descriptions/examples. */
  curated?: boolean

  // --- Imported from the official rule page (code-analysis docs) ---
  /** Documented subcategory, e.g. "Language rules (code-block preferences)". */
  subcategory?: string
  /** "Cause" section (quality rules). */
  cause?: string
  /** "How to fix violations" section (quality rules). */
  howToFix?: string
  /** "When to suppress warnings" section (quality rules). */
  whenToSuppress?: string
  /** "Enabled by default" note from the rule's property table. */
  enabledByDefault?: string
  /** Configurable .editorconfig options documented for the rule. */
  options?: RuleOption[]
  /** A representative C# example extracted from the rule's docs page. */
  example?: string
  /** Other rule IDs documented on the same page (derived). */
  related?: string[]
}
