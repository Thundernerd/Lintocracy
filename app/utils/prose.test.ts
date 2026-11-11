import { describe, expect, it } from 'vitest'
import { renderProse } from './prose'

describe('renderProse', () => {
  it('renders a pipe table with a separator row as a table with a header row', () => {
    const input = [
      'Rule names should not end in these suffixes:',
      '',
      '| Suffix | Base type |',
      '|----|----|',
      '| Attribute | System.Attribute |',
      '| Collection | System.Collections.ICollection |',
    ].join('\n')

    expect(renderProse(input)).toBe(
      '<p>Rule names should not end in these suffixes:</p>' +
        '<table>' +
        '<thead><tr><th>Suffix</th><th>Base type</th></tr></thead>' +
        '<tbody>' +
        '<tr><td>Attribute</td><td>System.Attribute</td></tr>' +
        '<tr><td>Collection</td><td>System.Collections.ICollection</td></tr>' +
        '</tbody>' +
        '</table>',
    )
  })

  it('turns <br/> inside a table cell into a line break', () => {
    const input = [
      '| Suffix | Base type |',
      '|----|----|',
      '| Collection | System.Collections.ICollection<br/><br/>System.Data.DataSet |',
    ].join('\n')

    expect(renderProse(input)).toContain(
      '<td>System.Collections.ICollection<br><br>System.Data.DataSet</td>',
    )
  })

  it('renders inline code in a table cell', () => {
    const input = [
      '| Overload | Suggested fix |',
      '| -------- | ------------- |',
      '| `String.IndexOf(char)` | `String.Contains(char)` |',
    ].join('\n')

    expect(renderProse(input)).toContain(
      '<tr><td><code>String.IndexOf(char)</code></td><td><code>String.Contains(char)</code></td></tr>',
    )
  })

  it('reads \\| in a table cell as a literal pipe, not a column break', () => {
    const input = [
      '| C# | Visual Basic | Alternate method name |',
      '| -- | ------------ | --------------------- |',
      '| \\|\\| | N/A | LogicalOr |',
    ].join('\n')

    expect(renderProse(input)).toContain('<tr><td>||</td><td>N/A</td><td>LogicalOr</td></tr>')
  })

  it('pads short rows and drops extra cells so every row matches the header', () => {
    const input = ['| A | B |', '|---|---|', '| only one |', '| 1 | 2 | 3 |'].join('\n')

    expect(renderProse(input)).toContain(
      '<tbody><tr><td>only one</td><td></td></tr><tr><td>1</td><td>2</td></tr></tbody>',
    )
  })

  it('is not a table when the separator row has a different number of columns', () => {
    const input = ['| A | B |', '|---|', '| 1 | 2 |'].join('\n')

    expect(renderProse(input)).toBe('<p>| A | B | |---| | 1 | 2 |</p>')
  })

  it('keeps lines with a stray | as paragraph text when there is no separator row', () => {
    const input = ['Combine flags with a | b.', '| not a table |', 'Still the same paragraph.'].join(
      '\n',
    )

    expect(renderProse(input)).toBe(
      '<p>Combine flags with a | b. | not a table | Still the same paragraph.</p>',
    )
  })
})
