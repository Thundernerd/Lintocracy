import type { Severity } from '#shared/types/rule'

type UiColor = 'error' | 'warning' | 'info' | 'neutral'

export const severityColor: Record<Severity, UiColor> = {
  error: 'error',
  warning: 'warning',
  suggestion: 'info',
  none: 'neutral',
}

export const severityIcon: Record<Severity, string> = {
  error: 'i-lucide-octagon-x',
  warning: 'i-lucide-triangle-alert',
  suggestion: 'i-lucide-lightbulb',
  none: 'i-lucide-circle-slash',
}

export const severityLabel: Record<Severity, string> = {
  error: 'Error',
  warning: 'Warning',
  suggestion: 'Suggestion',
  none: 'None (disabled)',
}

// Full literal class strings so Tailwind's scanner includes them.
export const severityTextClass: Record<Severity, string> = {
  error: 'text-error',
  warning: 'text-warning',
  suggestion: 'text-info',
  none: 'text-muted',
}

/** Severities a user can choose when voting "yes" (excludes `none`). */
export const yesSeverities: Severity[] = ['suggestion', 'warning', 'error']
