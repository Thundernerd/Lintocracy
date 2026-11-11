// PROTOTYPE (issue #1): throwaway visual-style registry. Do not ship.
//
// Question: which visual identity should Rule Wars have? Four styles, switchable on every
// page via `?style=<key>` and the floating bar in `app/components/prototype/StyleSwitcher.vue`.
// Each style sets Nuxt UI's runtime colours (`appConfig.ui.colors`) and a `data-style`
// attribute on <html>; the matching CSS lives in `app/assets/css/prototype-styles.css`.

export interface PrototypeStyle {
  key: string
  name: string
  /** Overrides for `appConfig.ui.colors`; anything not listed keeps the default. */
  colors: Record<string, string>
  /** Value for `<html data-style>`; `null` means no attribute (today's look). */
  dataStyle: string | null
}

export const prototypeStyles: PrototypeStyle[] = [
  { key: 'A', name: 'Baseline', colors: {}, dataStyle: null },
  {
    key: 'B',
    name: 'Terminal',
    colors: { primary: 'violet', secondary: 'cyan', neutral: 'zinc' },
    dataStyle: 'terminal',
  },
  {
    key: 'C',
    name: 'Editorial',
    colors: { primary: 'teal', secondary: 'amber', neutral: 'stone' },
    dataStyle: 'editorial',
  },
  {
    key: 'D',
    name: 'Arena',
    colors: { primary: 'blue', secondary: 'fuchsia', info: 'cyan', neutral: 'neutral' },
    dataStyle: 'arena',
  },
]

export const baselineStyle = prototypeStyles[0]!

export function findPrototypeStyle(key: unknown): PrototypeStyle {
  return prototypeStyles.find((s) => s.key === key) ?? baselineStyle
}
