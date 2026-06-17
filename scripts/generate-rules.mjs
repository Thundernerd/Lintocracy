// Generates server/data/rules.generated.json from the official Microsoft Learn
// code-analysis rule index pages. Run with: node scripts/generate-rules.mjs
//
// This produces a baseline entry for every CA (code quality) and IDE (code
// style) rule. Hand-curated rules in server/data/curated.ts override these at
// runtime with richer descriptions, examples, and preferred option values.
import { writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT = resolve(ROOT, 'server/data/rules.generated.json')
const DOCS = resolve(ROOT, 'code-analysis')

const LOCAL_QUALITY_INDEX = resolve(DOCS, 'quality-rules/index.md')
const LOCAL_STYLE_INDEX = resolve(DOCS, 'style-rules/index.md')
const QUALITY_INDEX =
  'https://raw.githubusercontent.com/dotnet/docs/main/docs/fundamentals/code-analysis/quality-rules/index.md'
const STYLE_INDEX =
  'https://raw.githubusercontent.com/dotnet/docs/main/docs/fundamentals/code-analysis/style-rules/index.md'

const QUALITY_BASE = 'https://learn.microsoft.com/dotnet/fundamentals/code-analysis/quality-rules'
const STYLE_BASE = 'https://learn.microsoft.com/dotnet/fundamentals/code-analysis/style-rules'

// Prefer the local docs clone (idempotent, offline); fall back to GitHub.
async function loadIndex(localPath, url) {
  if (existsSync(localPath)) return readFile(localPath, 'utf8')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.text()
}

const docsUrl = (base, file) => `${base}/${file.replace(/\.md$/, '')}`

// CA category by documented ID ranges (https://learn.microsoft.com/dotnet/fundamentals/code-analysis/quality-rules/).
function caGroup(num) {
  if (num >= 1000 && num < 1200) return 'Design'
  if (num >= 1200 && num < 1300) return 'Documentation'
  if (num >= 1300 && num < 1400) return 'Globalization'
  if (num >= 1400 && num < 1500) return 'Portability and interoperability'
  if (num >= 1500 && num < 1600) return 'Maintainability'
  if (num >= 1700 && num < 1800) return 'Naming'
  if (num >= 1800 && num < 2000) return 'Performance'
  if (num >= 2000 && num < 2100) return 'Reliability'
  if (num >= 2100 && num < 2200) return 'Security'
  if (num >= 2200 && num < 2300) return 'Usage'
  if (num >= 2300 && num < 2400) return 'Security'
  if (num >= 3000 && num < 4000) return 'Security'
  if (num >= 5000 && num < 6000) return 'Security'
  return 'Other'
}

function parseQuality(md) {
  const re = /\|\s*\[(CA\d{4}):\s*([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]*?)\s*\|/g
  const rules = []
  for (const m of md.matchAll(re)) {
    const [, id, title, file, description] = m
    const num = Number(id.slice(2))
    rules.push({
      id,
      title: title.trim(),
      category: 'quality',
      group: caGroup(num),
      summary: title.trim(),
      description: description.trim() || undefined,
      docsUrl: docsUrl(QUALITY_BASE, file),
      defaultSeverity: 'warning',
      supportsSeverity: true,
      editorconfig: { diagnosticId: id },
    })
  }
  return rules
}

function parseStyle(md) {
  const re = /\|\s*\[(IDE\d{4})\]\(([^)]+)\)\s*\|\s*([^|]+?)\s*\|([^\n]*)\|/g
  const rules = []
  for (const m of md.matchAll(re)) {
    const [, id, file, title] = m
    rules.push({
      id,
      title: title.replace(/`/g, '').trim(),
      category: 'style',
      group: 'Code style',
      summary: title.replace(/`/g, '').trim(),
      docsUrl: docsUrl(STYLE_BASE, file),
      defaultSeverity: 'suggestion',
      supportsSeverity: true,
      editorconfig: { diagnosticId: id },
    })
  }
  return rules
}

async function main() {
  const [qualityMd, styleMd] = await Promise.all([
    loadIndex(LOCAL_QUALITY_INDEX, QUALITY_INDEX),
    loadIndex(LOCAL_STYLE_INDEX, STYLE_INDEX),
  ])

  const quality = parseQuality(qualityMd)
  const style = parseStyle(styleMd)

  // De-duplicate by id (index pages can repeat shared-page rows) and sort.
  const byId = new Map()
  for (const r of [...style, ...quality]) {
    if (!byId.has(r.id)) byId.set(r.id, r)
  }
  const rules = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id))

  await writeFile(OUT, JSON.stringify(rules, null, 2) + '\n')
  console.log(
    `Wrote ${rules.length} rules (${style.length} IDE, ${quality.length} CA) to ${OUT}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
