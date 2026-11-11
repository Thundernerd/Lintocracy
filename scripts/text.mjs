// Text helpers for the rule scripts (generate-rules.mjs, enrich-rules.mjs).

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

/** Placeholder names for `count` generic parameters: `T` alone, else `T1`, `T2`, ... */
function genericParams(count, prefix) {
  return count === 1 ? [prefix] : Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`)
}

/**
 * Turns the target of an `<xref:...>` (a .NET documentation UID, optionally with
 * a `?displayProperty=...` query and a trailing `*`) into readable text. Generic
 * arity suffixes become type parameters, so no backtick survives to be read as
 * an inline code delimiter:
 *   System.Collections.Generic.List`1            -> System.Collections.Generic.List<T>
 *   System.Collections.Generic.Dictionary`2.Remove(`0)
 *                                                -> System.Collections.Generic.Dictionary<T1,T2>.Remove(T1)
 *   System.Linq.Enumerable.Any``1(System.Collections.Generic.IEnumerable{``0})
 *                                                -> System.Linq.Enumerable.Any<T>(System.Collections.Generic.IEnumerable<T>)
 * URL-encoded UIDs (`%28`, `%7B`, ...) are decoded first; by-ref markers (`@`) are dropped.
 */
export function formatXref(target) {
  let uid = target.split('?')[0].replace(/\*+$/, '')
  try {
    uid = decodeURIComponent(uid)
  } catch {
    // Not valid percent-encoding: keep it as written.
  }
  const parenIndex = uid.indexOf('(')
  const name = parenIndex === -1 ? uid : uid.slice(0, parenIndex)
  const paramList = parenIndex === -1 ? '' : uid.slice(parenIndex)

  // `N on a type, ``N on a method. Parameters refer to them by position as `i / ``i.
  const typeArgs = []
  let methodArgs = []
  const readableName = name.replace(/(`{1,2})(\d+)/g, (_, ticks, count) => {
    if (ticks.length === 2) {
      methodArgs = genericParams(Number(count), typeArgs.length ? 'U' : 'T')
      return `<${methodArgs.join(',')}>`
    }
    const args = genericParams(Number(count), 'T')
    typeArgs.push(...args)
    return `<${args.join(',')}>`
  })
  const readableParamList = paramList
    .replace(/``(\d+)/g, (_, i) => methodArgs[Number(i)] ?? 'T')
    .replace(/`(\d+)/g, (_, i) => typeArgs[Number(i)] ?? 'T')
    .replace(/\{/g, '<')
    .replace(/\}/g, '>')
    .replace(/@/g, '')
  return readableName + readableParamList
}
