import type { Highlighter } from 'shiki'

let highlighterPromise: Promise<Highlighter> | null = null

export async function getHighlighter() {
  if (!highlighterPromise) {
    const { createHighlighter } = await import('shiki')
    highlighterPromise = createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: ['csharp', 'ini'],
    })
  }
  return highlighterPromise
}
