const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Markdown escapes (`\*`, `\_`) become entities so the emphasis rules skip them. */
const escapedChar: Record<string, string> = { '*': '&#42;', '_': '&#95;', '\\': '&#92;' }

/** Renders bold and emphasis in text whose code spans are already replaced by placeholders. */
function renderEmphasis(s: string): string {
  return s
    .replace(/\\([*_\\])/g, (_, c: string) => escapedChar[c]!)
    .replace(/\*\*(?!\s)([^*]+?)(?<!\s)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w*])\*(?!\s)([^*]+?)(?<!\s)\*(?![\w*])/g, '$1<em>$2</em>')
    .replace(/(^|[^\w])_(?!\s)([^_]+?)(?<!\s)_(?!\w)/g, '$1<em>$2</em>')
}

/**
 * Renders one line of docs text (inline `code`, **bold**, *emphasis* / _emphasis_)
 * into safe HTML, without any block wrapper. Code spans are left untouched, so
 * `snake_case` or `a*b` inside backticks never turn into emphasis.
 */
export function renderInlineProse(input?: string): string {
  if (!input) return ''
  // Swap code spans for placeholders so emphasis can still wrap them
  // (`**bold `code`**`) without ever looking inside them.
  const codeSpans: string[] = []
  const withPlaceholders = escapeHtml(input).replace(/`([^`]+)`/g, (_, code: string) => {
    codeSpans.push(`<code>${code}</code>`)
    return `\u0000${codeSpans.length - 1}\u0000`
  })
  return renderEmphasis(withPlaceholders).replace(
    /\u0000(\d+)\u0000/g,
    (_, i: string) => codeSpans[Number(i)]!,
  )
}

/** A pipe-table row: starts with `|` (the docs always write the outer pipes). */
const isTableRow = (line: string) => line.startsWith('|')

/** The `|---|:--:|` line under a table's header row. */
const isTableSeparator = (line: string) => /^\|(\s*:?-+:?\s*\|)+$/.test(line)

/** Splits `| a | b |` into its trimmed cells; `\|` is a literal pipe inside a cell. */
const tableCells = (line: string) =>
  line
    .replace(/^\|/, '')
    .replace(/(?<!\\)\|$/, '')
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, '|'))

/** A header row followed by a separator row with the same number of columns. */
const startsTable = (header: string, separator = '') =>
  isTableRow(header) &&
  isTableSeparator(separator) &&
  tableCells(header).length === tableCells(separator).length

/** Renders a cell's inline markup; the docs write line breaks in cells as `<br/>`. */
const renderCell = (cell: string) =>
  cell
    .split(/<br\s*\/?>/i)
    .map((part) => renderInlineProse(part))
    .join('<br>')

function renderTable(header: string, rows: string[]): string {
  const width = tableCells(header).length
  // Like GFM, a row is padded with empty cells or cut to the header's width.
  const cells = (line: string, tag: 'th' | 'td') => {
    const values = tableCells(line)
    return Array.from({ length: width }, (_, i) => `<${tag}>${renderCell(values[i] ?? '')}</${tag}>`).join('')
  }
  const body = rows.map((row) => `<tr>${cells(row, 'td')}</tr>`).join('')
  return `<table><thead><tr>${cells(header, 'th')}</tr></thead><tbody>${body}</tbody></table>`
}

/**
 * Renders the lightly-cleaned docs text (plain text with inline markup,
 * `- ` / `* ` bullet lists and pipe tables) into safe HTML. Source is the
 * trusted local docs clone.
 */
export function renderProse(input?: string): string {
  if (!input) return ''

  const out: string[] = []
  let list: string[] = []
  let para: string[] = []

  const flushList = () => {
    if (list.length) {
      out.push(`<ul>${list.map((li) => `<li>${renderInlineProse(li)}</li>`).join('')}</ul>`)
      list = []
    }
  }
  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${renderInlineProse(para.join(' '))}</p>`)
      para = []
    }
  }

  const lines = input.split('\n').map((raw) => raw.trim())
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (startsTable(line, lines[i + 1])) {
      flushPara()
      flushList()
      // Body rows run from after the separator to the first non-table line.
      let end = i + 2
      while (end < lines.length && isTableRow(lines[end]!)) end++
      out.push(renderTable(line, lines.slice(i + 2, end)))
      i = end - 1
    } else if (/^[-*]\s+/.test(line)) {
      flushPara()
      list.push(line.replace(/^[-*]\s+/, ''))
    } else if (line === '') {
      flushPara()
      flushList()
    } else {
      flushList()
      para.push(line)
    }
  }
  flushPara()
  flushList()
  return out.join('')
}
