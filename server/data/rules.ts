import type { Rule } from '#shared/types/rule'
import { curatedRules } from './curated'
import generated from './rules.generated.json'

const curatedById = new Map(curatedRules.map((r) => [r.id, r]))

/** Curated fields win, but enriched-only fields (options, cause, ...) are kept. */
function merge(generatedRule: Rule): Rule {
  const curated = curatedById.get(generatedRule.id)
  if (!curated) return generatedRule
  return { ...generatedRule, ...curated, curated: true }
}

/**
 * The full Microsoft catalog (auto-imported + enriched from the docs pages)
 * merged with the hand-curated rules. Curated content overrides the imported
 * fields, while imported extras (option tables, cause, how-to-fix) are retained.
 */
const merged: Rule[] = [
  ...(generated as Rule[]).map(merge),
  // Include any curated rules that aren't present in the generated catalog.
  ...curatedRules.filter((r) => !(generated as Rule[]).some((g) => g.id === r.id)),
].sort((a, b) => {
  if (a.category !== b.category) return a.category === 'style' ? -1 : 1
  return a.id.localeCompare(b.id)
})

// Rules documented on the same page (same docsUrl) are related. Link them.
const byDocsUrl = new Map<string, Rule[]>()
for (const rule of merged) {
  const list = byDocsUrl.get(rule.docsUrl) ?? []
  list.push(rule)
  byDocsUrl.set(rule.docsUrl, list)
}
for (const group of byDocsUrl.values()) {
  if (group.length < 2) continue
  for (const rule of group) {
    rule.related = group.filter((r) => r.id !== rule.id).map((r) => r.id)
  }
}

export const rules: Rule[] = merged
