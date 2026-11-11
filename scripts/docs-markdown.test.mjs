import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseOptions } from './docs-markdown.mjs'

const optionsPage = (...tables) => `# IDE9999

## Options

${tables
  .map(
    (t) =>
      `### ${t.name}\n\n| Property | Value | Description |\n|--|--|--|\n| **Option name** | ${t.name} |  |\n${t.rows.join('\n')}\n`,
  )
  .join('\n')}
## Next section
`

test('an Options table whose "Option values" cell is a description yields a free-form option', () => {
  const md = optionsPage({
    name: 'csharp_preferred_modifier_order',
    rows: [
      '| **Applicable languages** | C# |  |',
      '| **Option values** | One or more C# modifiers, such as `public`, `private`, and `protected` |  |',
      '| **Default option value** | `public, private, protected` |  |',
    ],
  })

  assert.deepEqual(parseOptions(md), [
    { name: 'csharp_preferred_modifier_order', defaultValue: 'public, private, protected', values: undefined },
  ])
})

test('an option that lists literal values beside a described value is free-form', () => {
  const md = optionsPage({
    name: 'file_header_template',
    rows: [
      '| **Option values** | `unset` | Do not require a file header. |',
      '|  | non-empty string, optionally containing a `{fileName}` placeholder | Prefer the string as the required file header. |',
      '| **Default option value** | `unset` |  |',
    ],
  })

  assert.deepEqual(parseOptions(md), [{ name: 'file_header_template', defaultValue: 'unset', values: undefined }])
})

test('an option whose values are all literals keeps them as enumerated values', () => {
  const md = optionsPage({
    name: 'csharp_style_var_elsewhere',
    rows: [
      '| **Option values** | `true` | Prefer `var`. |',
      '|  | `false` | Prefer explicit types. |',
      '| **Default option value** | `false` |  |',
    ],
  })

  assert.deepEqual(parseOptions(md), [
    {
      name: 'csharp_style_var_elsewhere',
      defaultValue: 'false',
      values: [
        { value: 'true', description: 'Prefer `var`.' },
        { value: 'false', description: 'Prefer explicit types.' },
      ],
    },
  ])
})
