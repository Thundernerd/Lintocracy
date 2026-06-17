/**
 * Renders the lightly-cleaned docs text (plain text with inline `code`, **bold**,
 * and `- ` bullet lists) into safe HTML. Source is the trusted local docs clone.
 */
export function renderProse(input?: string): string {
  if (!input) return ''

  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const inline = (s: string) =>
    escape(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

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
