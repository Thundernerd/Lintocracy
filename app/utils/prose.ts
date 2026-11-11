const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Markdown escapes (`\*`, `\_`) become entities so the emphasis rules skip them. */
const escapedChar: Record<string, string> = { '*': '&#42;', '_': '&#95;', '\\': '&#92;' }

/** Bold and emphasis for a run of text that contains no code spans. */
function emphasis(s: string): string {
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
  return escapeHtml(input)
    .split(/(`[^`]+`)/)
    .map((part, i) => (i % 2 ? `<code>${part.slice(1, -1)}</code>` : emphasis(part)))
    .join('')
}

/**
 * Renders the lightly-cleaned docs text (plain text with inline markup and
 * `- ` / `* ` bullet lists) into safe HTML. Source is the trusted local docs clone.
 */
export function renderProse(input?: string): string {
  if (!input) return ''

  const inline = renderInlineProse

  const out: string[] = []
  let list: string[] = []
  let para: string[] = []

  const flushList = () => {
    if (list.length) {
      out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`)
      list = []
    }
  }
  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(' '))}</p>`)
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
