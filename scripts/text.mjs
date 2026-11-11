// Text helpers shared by the rule scripts (generate-rules.mjs, enrich-rules.mjs).

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  copy: '©',
  reg: '®',
  trade: '™',
  times: '×',
}

/**
 * Decodes HTML entities (`&#39;`, `&#x27;`, `&lt;`, `&mdash;`, ...) in one pass,
 * so `&amp;lt;` becomes `&lt;` rather than `<`. Unknown named entities are kept.
 */
function decodeEntities(text) {
  return text.replace(/&(#\d+|#x[\da-f]+|[a-z][a-z\d]*);/gi, (entity, name) => {
    if (name[0] === '#') {
      const code =
        name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : Number(name.slice(1))
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity
    }
    return NAMED_ENTITIES[name.toLowerCase()] ?? entity
  })
}

/**
 * Drops markdown backslash escapes before `<`, `>` and `|` (`Span\<T>` -> `Span<T>`).
 * `\*`, `\_` and `\\` stay: the UI renders emphasis, so app/utils/prose.ts
 * resolves those at render time.
 */
function unescapeMarkdown(text) {
  return text.replace(/\\([<>|])/g, '$1')
}

/** Turns docs markdown text into the literal characters it displays as. */
export function decodeDocsText(text) {
  return decodeEntities(unescapeMarkdown(text))
}
