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

/**
 * Renders the lightly-cleaned docs text (plain text with inline markup and
 * `- ` / `* ` bullet lists) into safe HTML. Source is the trusted local docs clone.
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

  for (const raw of input.split('\n')) {
    const line = raw.trim()
    if (/^[-*]\s+/.test(line)) {
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
