// Enriches server/data/rules.generated.json with content parsed from the local
// Microsoft docs clone in ./code-analysis. Run: node scripts/enrich-rules.mjs
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, basename } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const GENERATED = resolve(ROOT, 'server/data/rules.generated.json')
const DOCS = resolve(ROOT, 'code-analysis')

// ---- markdown helpers -------------------------------------------------------

function stripFrontmatter(md) {
  return md.replace(/^---\n[\s\S]*?\n---\n/, '')
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Returns the raw body of the first `## <name>` section (until the next `## `). */
function section(md, names) {
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

/** Converts docs markdown to readable plain text (keeps inline `code`). */
function cleanText(raw) {
  if (!raw) return undefined
  let t = stripCodeFences(raw)
  // Remove include directives, e.g. [!INCLUDE [label](path.md)].
  t = t.replace(/\[!INCLUDE\b[\s\S]*?\)\]/gi, '')
  // Drop note/tip/warning callout markers but keep their text (allow indent).
  t = t.replace(/^\s*>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*$/gim, '')
  t = t.replace(/^\s*>\s?/gm, '')
  // Remove zone/moniker pivots, e.g. :::zone pivot="..." and :::zone-end.
  t = t.replace(/^\s*:::.*$/gm, '')
  // <xref:System.Foo.Bar*?displayProperty=...> -> System.Foo.Bar (tolerate a missing `>`).
  t = t.replace(/<xref:([^>]+)>?/gi, (_, raw) => raw.split('?')[0].replace(/\*+$/, ''))
  // Markdown links [text](url) -> text
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  // Image / include directives
  t = t.replace(/:::.*$/gm, '')
  t = t.replace(/<!--.*?-->/gs, '')
  // Bullet markers kept; collapse excess whitespace.
  t = t.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  return t || undefined
}

/** Parses the bold property table that follows the page H1. */
function propertyTable(md) {
  const props = {}
  const re = /^\|\s*\*\*([^*]+?)\*\*\s*\|\s*(.+?)\s*\|\s*$/gm
  for (const m of md.matchAll(re)) {
    const key = m[1].trim()
    let value = m[2].trim()
    value = value.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/`/g, '')
    props[key] = value
  }
  return props
}

/** Extracts the first ```csharp block from a section (or whole doc). */
function firstCsharp(text) {
  if (!text) return undefined
  const m = text.match(/```csharp\s*\n([\s\S]*?)```/)
  if (!m) return undefined
  const code = m[1].replace(/\s+$/, '')
  return code.trim() ? code : undefined
}

/** Extracts every ```csharp block from a section. */
function allCsharpBlocks(text) {
  if (!text) return []
  return [...text.matchAll(/```csharp\s*\n([\s\S]*?)```/g)]
    .map((m) => m[1].replace(/\s+$/, '').trim())
    .filter(Boolean)
}

/** Reads `= true` / `= false` from the option comment on the first line of a sample. */
function optionFlagInBlock(block) {
  const m = (block.split('\n')[0] || '').match(/=\s*(true|false)\s*$/i)
  return m ? m[1].toLowerCase() : undefined
}

/**
 * Populates `example` or `examples` from all csharp blocks in a docs section.
 * Pairs of `= true` / `= false` option samples become avoid/prefer examples.
 */
function applyExamples(out, md, sectionNames) {
  const blocks = allCsharpBlocks(section(md, sectionNames))
  if (!blocks.length) return

  const trueBlock = blocks.find((b) => optionFlagInBlock(b) === 'true')
  const falseBlock = blocks.find((b) => optionFlagInBlock(b) === 'false')

  if (trueBlock && falseBlock) {
    out.examples = { bad: trueBlock, good: falseBlock }
    delete out.example
    return
  }

  if (blocks.length === 1) {
    out.example = blocks[0]
    delete out.examples
    return
  }

  out.example = blocks.join('\n\n')
  delete out.examples
}

/** Parses the `## Options` section into structured option blocks (style rules). */
function parseOptions(md) {
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
      const v = (cols[1] || '').replace(/`/g, '').trim()
      const desc = cleanText((cols[2] || '').trim()) || undefined
      if (/^Option name/i.test(label)) {
        name = v
        inValues = false
      } else if (/^Option values/i.test(label)) {
        inValues = true
        if (v) values.push({ value: v, description: desc })
      } else if (/^Default option value/i.test(label)) {
        defaultValue = v
        inValues = false
      } else if (label === '' && inValues && v) {
        values.push({ value: v, description: desc })
      } else if (label && !/^(Property|---)/i.test(label)) {
        inValues = false
      }
    }

    if (name) options.push({ name, defaultValue, values: values.length ? values : undefined })
  }

  return options.length ? options : undefined
}

function docFileFor(rule) {
  const slug = basename(new URL(rule.docsUrl).pathname)
  const sub = rule.category === 'style' ? 'style-rules' : 'quality-rules'
  return resolve(DOCS, sub, `${slug}.md`)
}

async function enrich(rule) {
  const file = docFileFor(rule)
  if (!existsSync(file)) return { rule, ok: false }

  const md = stripFrontmatter(await readFile(file, 'utf8'))
  const props = propertyTable(md)
  const out = { ...rule }

  if (props['Subcategory']) {
    out.subcategory = props['Subcategory']
    out.group = props['Subcategory']
  }
  const enabledKey = Object.keys(props).find((k) => /^Enabled by default/i.test(k))
  if (enabledKey) out.enabledByDefault = props[enabledKey]
  if (props['Title']) {
    out.title = props['Title'].replace(/`/g, '').trim()
    out.summary = out.title
  }

  if (rule.category === 'style') {
    out.description = cleanText(section(md, ['Overview'])) || out.description
    out.options = parseOptions(md)
    applyExamples(out, md, ['Example', 'Examples'])
    if (!out.example && !out.examples) {
      out.example =
        firstCsharp(section(md, ['Options'])) ||
        firstCsharp(md)
    }
  } else {
    out.cause = cleanText(section(md, ['Cause']))
    const indexDesc = cleanText(out.description)
    const sectionDesc = cleanText(section(md, ['Rule description']))
    out.description =
      sectionDesc && sectionDesc.length > (indexDesc?.length ?? 0) ? sectionDesc : indexDesc
    out.howToFix = cleanText(section(md, ['How to fix violations']))
    out.whenToSuppress = cleanText(section(md, ['When to suppress warnings', 'When to suppress errors']))
    applyExamples(out, md, ['Example', 'Examples', 'Example 1', 'Pseudo-code examples'])
    if (!out.example && !out.examples) {
      out.example =
        firstCsharp(section(md, ['How to fix violations'])) ||
        firstCsharp(md)
    }
  }

  // Final safety pass so no raw markdown/xref leaks into any text field.
  if (out.title) out.title = cleanText(out.title)
  out.summary = cleanText(out.summary) || out.summary
  if (out.description) out.description = cleanText(out.description)

  // Drop undefined keys for a clean JSON.
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k]
  return { rule: out, ok: true }
}

async function main() {
  const rules = JSON.parse(await readFile(GENERATED, 'utf8'))
  let enriched = 0
  let missing = 0
  const result = []

  for (const rule of rules) {
    const { rule: r, ok } = await enrich(rule)
    if (ok) enriched++
    else missing++
    result.push(r)
  }

  await writeFile(GENERATED, JSON.stringify(result, null, 2) + '\n')
  console.log(`Enriched ${enriched} rules from docs (${missing} missing local page).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
