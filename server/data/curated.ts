import type { Rule } from '#shared/types/rule'

const STYLE_DOCS = 'https://learn.microsoft.com/dotnet/fundamentals/code-analysis/style-rules'
const QUALITY_DOCS = 'https://learn.microsoft.com/dotnet/fundamentals/code-analysis/quality-rules'

/**
 * Hand-curated rules with rich descriptions, rationale, examples, and the
 * preferred .editorconfig option values. These override the auto-imported
 * entries from the full Microsoft catalog (see rules.generated.json).
 */
export const curatedRules: Rule[] = [
  // ---------------------------------------------------------------------------
  // Code style rules (IDExxxx)
  // ---------------------------------------------------------------------------
  {
    id: 'IDE0011',
    title: 'Add braces',
    category: 'style',
    group: 'Code block preferences',
    summary: 'Require braces around the bodies of if, else, for, while, and similar statements.',
    description:
      'Controls whether braces are required even for single-line statement bodies. Enforcing braces avoids a class of bugs where an added second statement is silently excluded from a conditional block.',
    whyItMatters:
      'Single-statement blocks without braces are a common source of "goto fail"-style bugs when code is later edited.',
    examples: {
      bad: 'if (cart.IsEmpty)\n    return;',
      good: 'if (cart.IsEmpty)\n{\n    return;\n}',
    },
    docsUrl: `${STYLE_DOCS}/ide0011`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: { diagnosticId: 'IDE0011', options: [{ key: 'csharp_prefer_braces', value: 'true' }] },
  },
  {
    id: 'IDE0007',
    title: 'Use var',
    category: 'style',
    group: 'var preferences',
    summary: 'Prefer `var` over an explicit type in local variable declarations.',
    description:
      'Encourages implicitly typed local variables with `var`. Reduces redundancy when the type is already obvious from the right-hand side.',
    whyItMatters:
      'Consistent use of `var` reduces noise and keeps declarations focused on intent rather than type names.',
    examples: {
      bad: 'List<Order> orders = new List<Order>();',
      good: 'var orders = new List<Order>();',
    },
    docsUrl: `${STYLE_DOCS}/ide0007-ide0008`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: {
      diagnosticId: 'IDE0007',
      options: [
        { key: 'csharp_style_var_for_built_in_types', value: 'true' },
        { key: 'csharp_style_var_when_type_is_apparent', value: 'true' },
        { key: 'csharp_style_var_elsewhere', value: 'true' },
      ],
    },
  },
  {
    id: 'IDE0040',
    title: 'Add accessibility modifiers',
    category: 'style',
    group: 'Modifier preferences',
    summary: 'Require explicit accessibility modifiers (e.g. `private`) on members.',
    description:
      'Requires that accessibility modifiers are stated explicitly rather than relying on language defaults.',
    whyItMatters:
      'Explicit modifiers make the intended visibility obvious and avoid surprises from implicit defaults.',
    examples: {
      bad: 'class Repository\n{\n    int _count;\n}',
      good: 'class Repository\n{\n    private int _count;\n}',
    },
    docsUrl: `${STYLE_DOCS}/ide0040`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: {
      diagnosticId: 'IDE0040',
      options: [{ key: 'dotnet_style_require_accessibility_modifiers', value: 'for_non_interface_members' }],
    },
  },
  {
    id: 'IDE0044',
    title: 'Add readonly modifier',
    category: 'style',
    group: 'Modifier preferences',
    summary: 'Mark fields that are only assigned in the constructor as `readonly`.',
    description:
      'Flags private fields that are never reassigned after construction so they can be marked `readonly`.',
    whyItMatters:
      'Readonly fields communicate immutability and let the compiler enforce that the field is not reassigned.',
    examples: {
      bad: 'private ILogger _logger;\npublic Service(ILogger logger) => _logger = logger;',
      good: 'private readonly ILogger _logger;\npublic Service(ILogger logger) => _logger = logger;',
    },
    docsUrl: `${STYLE_DOCS}/ide0044`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: { diagnosticId: 'IDE0044', options: [{ key: 'dotnet_style_readonly_field', value: 'true' }] },
  },
  {
    id: 'IDE0055',
    title: 'Fix formatting',
    category: 'style',
    group: 'Formatting',
    summary: 'Enforce consistent whitespace, indentation, and new-line formatting.',
    description:
      'Aggregates the C# formatting options (indentation, spacing, new lines). Violations are reported when code does not match the configured formatting conventions.',
    whyItMatters:
      'Consistent formatting reduces diff noise and review friction across a team.',
    examples: {
      bad: 'if(ready){ Run(); }',
      good: 'if (ready)\n{\n    Run();\n}',
    },
    docsUrl: `${STYLE_DOCS}/ide0055`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: { diagnosticId: 'IDE0055' },
  },
  {
    id: 'IDE0060',
    title: 'Remove unused parameter',
    category: 'style',
    group: 'Parameter preferences',
    summary: 'Flag parameters that are never used by the method body.',
    description:
      'Detects parameters that are never read. The scope is configurable to all parameters or only non-public methods.',
    whyItMatters:
      'Unused parameters are dead weight that mislead callers about what a method actually needs.',
    examples: {
      bad: 'int Add(int a, int b, int unused) => a + b;',
      good: 'int Add(int a, int b) => a + b;',
    },
    docsUrl: `${STYLE_DOCS}/ide0060`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: {
      diagnosticId: 'IDE0060',
      options: [{ key: 'dotnet_code_quality_unused_parameters', value: 'all' }],
    },
  },
  {
    id: 'IDE0063',
    title: 'Use simple using statement',
    category: 'style',
    group: 'Code block preferences',
    summary: 'Prefer the declaration-form `using` statement over a `using` block.',
    description:
      'Prefers `using var x = ...;` over the older `using (var x = ...) { }` block form when scoping to the end of the enclosing block is acceptable.',
    whyItMatters:
      'The simple form reduces nesting and visual noise for the common disposal pattern.',
    examples: {
      bad: 'using (var stream = File.OpenRead(path))\n{\n    Process(stream);\n}',
      good: 'using var stream = File.OpenRead(path);\nProcess(stream);',
    },
    docsUrl: `${STYLE_DOCS}/ide0063`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: {
      diagnosticId: 'IDE0063',
      options: [{ key: 'csharp_prefer_simple_using_statement', value: 'true' }],
    },
  },
  {
    id: 'IDE0066',
    title: 'Use switch expression',
    category: 'style',
    group: 'Expression-level preferences',
    summary: 'Prefer a `switch` expression over a `switch` statement where applicable.',
    description:
      'Suggests converting a `switch` statement that simply assigns or returns a value into a more concise `switch` expression.',
    whyItMatters:
      'Switch expressions are more concise and force exhaustiveness, reducing the chance of a forgotten case.',
    examples: {
      bad: 'switch (status)\n{\n    case Status.Open: return "open";\n    default: return "closed";\n}',
      good: 'return status switch\n{\n    Status.Open => "open",\n    _ => "closed",\n};',
    },
    docsUrl: `${STYLE_DOCS}/ide0066`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: {
      diagnosticId: 'IDE0066',
      options: [{ key: 'csharp_style_prefer_switch_expression', value: 'true' }],
    },
  },
  {
    id: 'IDE0090',
    title: 'Simplify new expression',
    category: 'style',
    group: 'Expression-level preferences',
    summary: 'Use target-typed `new()` when the type is apparent.',
    description:
      'Prefers `new()` over `new TypeName()` when the type can be inferred from the declaration context.',
    whyItMatters:
      'Target-typed new reduces repetition of long type names without losing type safety.',
    examples: {
      bad: 'private Dictionary<string, int> _map = new Dictionary<string, int>();',
      good: 'private Dictionary<string, int> _map = new();',
    },
    docsUrl: `${STYLE_DOCS}/ide0090`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: {
      diagnosticId: 'IDE0090',
      options: [{ key: 'csharp_style_implicit_object_creation_when_type_is_apparent', value: 'true' }],
    },
  },
  {
    id: 'IDE0017',
    title: 'Use object initializers',
    category: 'style',
    group: 'Expression-level preferences',
    summary: 'Prefer object initializers over separate property assignments.',
    description:
      'Suggests collapsing a sequence of property assignments after construction into an object initializer.',
    whyItMatters:
      'Object initializers keep construction and configuration together and read more declaratively.',
    examples: {
      bad: 'var user = new User();\nuser.Name = "Ada";\nuser.Active = true;',
      good: 'var user = new User\n{\n    Name = "Ada",\n    Active = true,\n};',
    },
    docsUrl: `${STYLE_DOCS}/ide0017`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: {
      diagnosticId: 'IDE0017',
      options: [{ key: 'dotnet_style_object_initializer', value: 'true' }],
    },
  },
  {
    id: 'IDE0028',
    title: 'Use collection initializers',
    category: 'style',
    group: 'Expression-level preferences',
    summary: 'Prefer collection initializers over repeated `Add` calls.',
    description:
      'Suggests using a collection initializer instead of multiple consecutive `Add` invocations.',
    whyItMatters:
      'Collection initializers express intent in a single, readable expression.',
    examples: {
      bad: 'var list = new List<int>();\nlist.Add(1);\nlist.Add(2);',
      good: 'var list = new List<int> { 1, 2 };',
    },
    docsUrl: `${STYLE_DOCS}/ide0028`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: {
      diagnosticId: 'IDE0028',
      options: [{ key: 'dotnet_style_collection_initializer', value: 'true' }],
    },
  },
  {
    id: 'IDE0029',
    title: 'Use coalesce expression',
    category: 'style',
    group: 'Null-checking preferences',
    summary: 'Prefer the null-coalescing operator `??` over equivalent conditionals.',
    description:
      'Suggests replacing `x != null ? x : y` style conditionals with the `??` operator.',
    whyItMatters:
      'The coalesce operator is shorter and removes a branch that can hide subtle bugs.',
    examples: {
      bad: 'var name = input != null ? input : "anonymous";',
      good: 'var name = input ?? "anonymous";',
    },
    docsUrl: `${STYLE_DOCS}/ide0029-ide0030`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: {
      diagnosticId: 'IDE0029',
      options: [{ key: 'dotnet_style_coalesce_expression', value: 'true' }],
    },
  },
  {
    id: 'IDE0031',
    title: 'Use null propagation',
    category: 'style',
    group: 'Null-checking preferences',
    summary: 'Prefer the null-conditional operator `?.` over null-check conditionals.',
    description:
      'Suggests replacing `x != null ? x.Y : null` with `x?.Y`.',
    whyItMatters:
      'Null propagation is concise and avoids accidentally dereferencing a null value.',
    examples: {
      bad: 'var length = text != null ? text.Length : (int?)null;',
      good: 'var length = text?.Length;',
    },
    docsUrl: `${STYLE_DOCS}/ide0031`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: {
      diagnosticId: 'IDE0031',
      options: [{ key: 'dotnet_style_null_propagation', value: 'true' }],
    },
  },
  {
    id: 'IDE0065',
    title: 'using directive placement',
    category: 'style',
    group: 'using directive preferences',
    summary: 'Control whether `using` directives go inside or outside the namespace.',
    description:
      'Configures the preferred placement of `using` directives relative to the namespace declaration.',
    whyItMatters:
      'A consistent placement avoids needless diffs and keeps files uniform.',
    examples: {
      bad: 'namespace App\n{\n    using System;\n}',
      good: 'using System;\n\nnamespace App\n{\n}',
    },
    docsUrl: `${STYLE_DOCS}/ide0065`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: {
      diagnosticId: 'IDE0065',
      options: [{ key: 'csharp_using_directive_placement', value: 'outside_namespace' }],
    },
  },
  {
    id: 'IDE0161',
    title: 'Use file-scoped namespace',
    category: 'style',
    group: 'Code block preferences',
    summary: 'Prefer file-scoped namespace declarations.',
    description:
      'Prefers the file-scoped namespace form `namespace App;` over the braced block form.',
    whyItMatters:
      'File-scoped namespaces remove a level of indentation for the entire file.',
    examples: {
      bad: 'namespace App\n{\n    public class Order { }\n}',
      good: 'namespace App;\n\npublic class Order { }',
    },
    docsUrl: `${STYLE_DOCS}/ide0161`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: {
      diagnosticId: 'IDE0161',
      options: [{ key: 'csharp_style_namespace_declarations', value: 'file_scoped' }],
    },
  },
  {
    id: 'IDE1006',
    title: 'Naming styles',
    category: 'style',
    group: 'Naming',
    summary: 'Enforce naming conventions (e.g. PascalCase for public members).',
    description:
      'Reports identifiers that do not match the configured naming rules. Naming rules themselves are defined via `dotnet_naming_*` options.',
    whyItMatters:
      'Consistent naming is one of the highest-signal readability conventions in a codebase.',
    examples: {
      bad: 'public int order_count;',
      good: 'public int OrderCount;',
    },
    docsUrl: `${STYLE_DOCS}/ide1006`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: { diagnosticId: 'IDE1006' },
  },

  // ---------------------------------------------------------------------------
  // Code quality rules (CAxxxx)
  // ---------------------------------------------------------------------------
  {
    id: 'CA2007',
    title: 'Do not directly await a Task',
    category: 'quality',
    group: 'Reliability',
    summary: 'Call `ConfigureAwait(false)` on awaited tasks in library code.',
    description:
      'Recommends specifying `ConfigureAwait` when awaiting a Task to make context-capturing behavior explicit, especially important in library code.',
    whyItMatters:
      'Capturing the synchronization context unnecessarily can cause deadlocks and performance issues in libraries.',
    examples: {
      bad: 'await DownloadAsync();',
      good: 'await DownloadAsync().ConfigureAwait(false);',
    },
    docsUrl: `${QUALITY_DOCS}/ca2007`,
    defaultSeverity: 'warning',
    supportsSeverity: true,
    editorconfig: { diagnosticId: 'CA2007' },
  },
  {
    id: 'CA1062',
    title: 'Validate arguments of public methods',
    category: 'quality',
    group: 'Design',
    summary: 'Null-check reference parameters of externally visible methods.',
    description:
      'Externally visible methods should validate their reference-type arguments against null before dereferencing them.',
    whyItMatters:
      'Validating arguments produces clear ArgumentNullExceptions instead of confusing NullReferenceExceptions deep in the call stack.',
    examples: {
      bad: 'public void Print(Order order) => Console.WriteLine(order.Id);',
      good: 'public void Print(Order order)\n{\n    ArgumentNullException.ThrowIfNull(order);\n    Console.WriteLine(order.Id);\n}',
    },
    docsUrl: `${QUALITY_DOCS}/ca1062`,
    defaultSeverity: 'warning',
    supportsSeverity: true,
    editorconfig: { diagnosticId: 'CA1062' },
  },
  {
    id: 'CA1822',
    title: 'Mark members as static',
    category: 'quality',
    group: 'Performance',
    summary: 'Mark members that do not access instance state as `static`.',
    description:
      'Members that do not use instance data can be marked static, which avoids passing the hidden `this` parameter.',
    whyItMatters:
      'Static members avoid an unnecessary `this` argument and make it clear the member does not depend on instance state.',
    examples: {
      bad: 'public int Square(int x) => x * x;',
      good: 'public static int Square(int x) => x * x;',
    },
    docsUrl: `${QUALITY_DOCS}/ca1822`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: { diagnosticId: 'CA1822' },
  },
  {
    id: 'CA1825',
    title: 'Avoid zero-length array allocations',
    category: 'quality',
    group: 'Performance',
    summary: 'Use `Array.Empty<T>()` instead of allocating an empty array.',
    description:
      'Allocating a new zero-length array is wasteful; `Array.Empty<T>()` returns a cached singleton.',
    whyItMatters:
      'Reusing the cached empty array avoids needless allocations on hot paths.',
    examples: {
      bad: 'return new int[0];',
      good: 'return Array.Empty<int>();',
    },
    docsUrl: `${QUALITY_DOCS}/ca1825`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: { diagnosticId: 'CA1825' },
  },
  {
    id: 'CA1305',
    title: 'Specify IFormatProvider',
    category: 'quality',
    group: 'Globalization',
    summary: 'Pass an explicit culture / format provider to formatting APIs.',
    description:
      'Methods that format or parse values should be given an explicit IFormatProvider to avoid culture-dependent behavior.',
    whyItMatters:
      'Relying on the current culture causes bugs that only appear on machines with different locale settings.',
    examples: {
      bad: 'var s = value.ToString();',
      good: 'var s = value.ToString(CultureInfo.InvariantCulture);',
    },
    docsUrl: `${QUALITY_DOCS}/ca1305`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: { diagnosticId: 'CA1305' },
  },
  {
    id: 'CA1310',
    title: 'Specify StringComparison for correctness',
    category: 'quality',
    group: 'Globalization',
    summary: 'Pass an explicit StringComparison to string operations.',
    description:
      'String comparison methods that use the current culture by default should be called with an explicit StringComparison.',
    whyItMatters:
      'Implicit culture-sensitive comparisons cause subtle, hard-to-reproduce bugs across locales.',
    examples: {
      bad: 'if (name.StartsWith("admin")) { }',
      good: 'if (name.StartsWith("admin", StringComparison.Ordinal)) { }',
    },
    docsUrl: `${QUALITY_DOCS}/ca1310`,
    defaultSeverity: 'warning',
    supportsSeverity: true,
    editorconfig: { diagnosticId: 'CA1310' },
  },
  {
    id: 'CA2000',
    title: 'Dispose objects before losing scope',
    category: 'quality',
    group: 'Reliability',
    summary: 'Dispose IDisposable objects before they go out of scope.',
    description:
      'Objects implementing IDisposable should be disposed before all references to them go out of scope.',
    whyItMatters:
      'Failing to dispose can leak unmanaged resources such as file handles and sockets.',
    examples: {
      bad: 'var stream = new FileStream(path, FileMode.Open);\nReturn(stream.Length);',
      good: 'using var stream = new FileStream(path, FileMode.Open);\nReturn(stream.Length);',
    },
    docsUrl: `${QUALITY_DOCS}/ca2000`,
    defaultSeverity: 'warning',
    supportsSeverity: true,
    editorconfig: { diagnosticId: 'CA2000' },
  },
  {
    id: 'CA1031',
    title: 'Do not catch general exception types',
    category: 'quality',
    group: 'Design',
    summary: 'Avoid catching `Exception` or `SystemException` broadly.',
    description:
      'Catching general exception types can swallow unexpected errors and hide bugs. Catch specific exception types instead.',
    whyItMatters:
      'Broad catches mask programming errors and make failures harder to diagnose.',
    examples: {
      bad: 'try { Run(); }\ncatch (Exception) { }',
      good: 'try { Run(); }\ncatch (IOException ex) { Log(ex); }',
    },
    docsUrl: `${QUALITY_DOCS}/ca1031`,
    defaultSeverity: 'suggestion',
    supportsSeverity: true,
    editorconfig: { diagnosticId: 'CA1031' },
  },
  {
    id: 'CA1051',
    title: 'Do not declare visible instance fields',
    category: 'quality',
    group: 'Design',
    summary: 'Expose data through properties rather than public fields.',
    description:
      'Public or protected instance fields break encapsulation. Use properties instead.',
    whyItMatters:
      'Properties allow validation, change tracking, and binary-compatible evolution that public fields do not.',
    examples: {
      bad: 'public class Point\n{\n    public int X;\n}',
      good: 'public class Point\n{\n    public int X { get; set; }\n}',
    },
    docsUrl: `${QUALITY_DOCS}/ca1051`,
    defaultSeverity: 'warning',
    supportsSeverity: true,
    editorconfig: { diagnosticId: 'CA1051' },
  },
  {
    id: 'CA1816',
    title: 'Call GC.SuppressFinalize correctly',
    category: 'quality',
    group: 'Usage',
    summary: 'Call `GC.SuppressFinalize(this)` in Dispose implementations.',
    description:
      'Dispose methods should call GC.SuppressFinalize so the object is not finalized unnecessarily.',
    whyItMatters:
      'Suppressing finalization after disposal avoids the cost of running the finalizer on an already-cleaned object.',
    examples: {
      bad: 'public void Dispose()\n{\n    _handle.Close();\n}',
      good: 'public void Dispose()\n{\n    _handle.Close();\n    GC.SuppressFinalize(this);\n}',
    },
    docsUrl: `${QUALITY_DOCS}/ca1816`,
    defaultSeverity: 'warning',
    supportsSeverity: true,
    editorconfig: { diagnosticId: 'CA1816' },
  },
  {
    id: 'CA1849',
    title: 'Call async methods when in an async method',
    category: 'quality',
    group: 'Performance',
    summary: 'Prefer awaiting async APIs over their blocking counterparts.',
    description:
      'Within an async method, prefer the asynchronous version of an API instead of a blocking call that ties up a thread.',
    whyItMatters:
      'Blocking calls inside async methods waste threads and can cause thread-pool starvation.',
    examples: {
      bad: 'async Task Save()\n{\n    stream.Write(buffer);\n}',
      good: 'async Task Save()\n{\n    await stream.WriteAsync(buffer);\n}',
    },
    docsUrl: `${QUALITY_DOCS}/ca1849`,
    defaultSeverity: 'warning',
    supportsSeverity: true,
    editorconfig: { diagnosticId: 'CA1849' },
  },
  {
    id: 'CA5350',
    title: 'Do not use weak cryptographic algorithms',
    category: 'quality',
    group: 'Security',
    summary: 'Avoid broken/weak algorithms such as SHA1, MD5, DES, and RC2.',
    description:
      'Flags use of cryptographic algorithms that are considered weak or broken. Use stronger algorithms such as SHA256 or AES.',
    whyItMatters:
      'Weak algorithms are vulnerable to practical attacks and should never protect sensitive data.',
    examples: {
      bad: 'using var hash = SHA1.Create();',
      good: 'using var hash = SHA256.Create();',
    },
    docsUrl: `${QUALITY_DOCS}/ca5350`,
    defaultSeverity: 'warning',
    supportsSeverity: true,
    editorconfig: { diagnosticId: 'CA5350' },
  },
  {
    id: 'CA2100',
    title: 'Review SQL queries for security vulnerabilities',
    category: 'quality',
    group: 'Security',
    summary: 'Avoid building SQL command text from untrusted input.',
    description:
      'Flags SQL command text built via string concatenation, which is a SQL-injection risk. Use parameterized queries instead.',
    whyItMatters:
      'String-concatenated SQL is the classic SQL-injection vector and can expose or destroy data.',
    examples: {
      bad: 'cmd.CommandText = "SELECT * FROM Users WHERE Name = \'" + name + "\'";',
      good: 'cmd.CommandText = "SELECT * FROM Users WHERE Name = @name";\ncmd.Parameters.AddWithValue("@name", name);',
    },
    docsUrl: `${QUALITY_DOCS}/ca2100`,
    defaultSeverity: 'warning',
    supportsSeverity: true,
    editorconfig: { diagnosticId: 'CA2100' },
  },
]
