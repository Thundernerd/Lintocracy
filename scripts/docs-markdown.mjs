// Parsers for the Microsoft docs markdown read by enrich-rules.mjs.
import { decodeDocsText, formatXref } from './text.mjs'

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Returns the raw body of the first `## <name>` section (until the next `## `). */
export function section(md, names) {
  const padded = '\n' + md
  for (const name of names) {
    const re = new RegExp(`\\n##\\s+${escapeRe(name)}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`)
    const m = padded.match(re)
    if (m) return m[1].trim()
  }
  return undefined
}

/** Removes fenced code blocks from a chunk of markdown. */
function stripCodeFences(text) {
  return text.replace(/```[\s\S]*?```/g, '').replace(/:::[\s\S]*?:::/g, '')
}

/**
 * Strips docs markdown down to readable text (keeps inline `code`) without
 * decoding entities, so it is safe to run again on already-cleaned text.
 */
export function stripMarkdown(raw) {
  if (!raw) return undefined
  let t = stripCodeFences(raw)
  // Remove include directives, e.g. [!INCLUDE [label](path.md)].
  t = t.replace(/\[!INCLUDE\b[\s\S]*?\)\]/gi, '')
  // Drop note/tip/warning callout markers but keep their text (allow indent).
  t = t.replace(/^\s*>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*$/gim, '')
  t = t.replace(/^\s*>\s?/gm, '')
  // Remove zone/moniker pivots, e.g. :::zone pivot="..." and :::zone-end.
  t = t.replace(/^\s*:::.*$/gm, '')
  // <xref:System.Foo.Bar*?displayProperty=...> -> System.Foo.Bar (tolerate a missing `>`),
  // with generic arity spelled out (List`1 -> List<T>) so no backtick is left behind.
  t = t.replace(/<xref:([^>]+)>?/gi, (_, target) => formatXref(target))
  // Markdown links [text](url) -> text
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  // Image / include directives
  t = t.replace(/:::.*$/gm, '')
  t = t.replace(/<!--.*?-->/gs, '')
  // Bullet markers kept; collapse excess whitespace.
  t = t.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  return t || undefined
}

/**
 * Converts raw docs markdown to readable plain text, decoding entities and
 * backslash escapes (&#39;, &lt;, &mdash;, \<T\>) to literal characters.
 * Decode exactly once: text that is already clean goes through stripMarkdown.
 */
export function cleanText(raw) {
  const t = stripMarkdown(raw)
  return t && (decodeDocsText(t) || undefined)
}

/**
 * Whether a raw "Option values" cell is a literal `.editorconfig` value: a
 * single code span (`true`) or one bare token. Anything else is prose that
 * describes the accepted values ("One or more C# modifiers, such as ...").
 */
function isLiteralValueCell(cell) {
  return /^`[^`]+`$/.test(cell) || /^[^\s`]+$/.test(cell)
}

/** Parses the `## Options` section into structured option blocks (style rules). */
export function parseOptions(md) {
  const body = section(md, ['Options'])
  if (!body) return undefined
  const blocks = body.split(/^###\s+/m).slice(1)
  const options = []

  for (const block of blocks) {
    const rows = [...block.matchAll(/^\|(.+)\|\s*$/gm)].map((m) =>
      m[1].split('|').map((c) => c.trim()),
    )
    let name
    let defaultValue
    const values = []
    let inValues = false

    for (const cols of rows) {
      const label = (cols[0] || '').replace(/\*/g, '').trim()
      const cell = (cols[1] || '').trim()
      const v = cell.replace(/`/g, '').trim()
      const desc = cleanText((cols[2] || '').trim()) || undefined
      // Only literal cells are values; a prose cell describes values and is dropped.
      const collectValueCell = () => {
        if (v && isLiteralValueCell(cell)) values.push({ value: v, description: desc })
      }
      if (/^Option name/i.test(label)) {
        name = v
        inValues = false
      } else if (/^Option values/i.test(label)) {
        inValues = true
        collectValueCell()
      } else if (/^Default option value/i.test(label)) {
        defaultValue = v
        inValues = false
      } else if (label === '' && inValues) {
        collectValueCell()
      } else if (label && !/^(Property|---)/i.test(label)) {
        inValues = false
      }
    }

    // With no literal left, `values: undefined` makes the option free-form:
    // the API then accepts any value instead of checking it against a list.
    if (name) options.push({ name, defaultValue, values: values.length ? values : undefined })
  }

  return options.length ? options : undefined
}
