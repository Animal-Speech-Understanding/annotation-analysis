/**
 * @type {import("prettier").Config}
 */
module.exports = {
  // -------- Core Formatting --------

  // Maximum line length before wrapping.
  // 100 is a common modern choice, balancing readability and screen space.
  // Alternatives: 80 (traditional), 120 (for wider screens)
  printWidth: 100,

  // Number of spaces per indentation level.
  // 2 is the standard in the JavaScript community.
  tabWidth: 2,

  // Use spaces instead of tabs for indentation.
  // Crucial for consistent rendering across editors.
  useTabs: false,

  // Print semicolons at the ends of statements.
  // Safer and reduces ambiguity compared to relying on ASI.
  semi: true,

  // Use single quotes instead of double quotes for strings.
  // Common preference in JS, slightly less verbose.
  singleQuote: true,

  // Controls the printing of quotes in object properties.
  // 'as-needed': Only add quotes around object properties where required.
  // 'consistent': If at least one property needs quotes, quote all properties.
  // 'preserve': Respect the input usage of quotes in object properties.
  quoteProps: 'as-needed',

  // Use single quotes instead of double quotes in JSX.
  jsxSingleQuote: true, // Matches `singleQuote`

  // Print trailing commas wherever possible in multi-line comma-separated syntactic structures.
  // 'es5': Trailing commas where valid in ES5 (objects, arrays, etc.). Function parameters/arguments are excluded. (Safer default)
  // 'all': Trailing commas wherever possible (including function args/params). Requires newer environments/transpilers. (Best for Git diffs)
  // 'none': No trailing commas.
  trailingComma: 'es5',

  // -------- Spacing --------

  // Print spaces between brackets in object literals.
  // Example: { foo: bar } instead of {foo: bar}
  bracketSpacing: true,

  // Put the `>` of a multi-line JSX element at the end of the last line instead of being alone on the next line.
  // Example: <div\n  foo="bar"\n> instead of <div\n  foo="bar"\n >
  // Set to `false` for better readability and closer alignment with HTML.
  bracketSameLine: false, // Often preferred over `true` (previously `jsxBracketSameLine`)

  // Include parentheses around a sole arrow function parameter.
  // 'always': Always include parens. Example: `(x) => x` (Consistent and required for type annotations)
  // 'avoid': Omit parens when possible. Example: `x => x`
  arrowParens: 'always',

  // -------- Other --------

  // Specify the line ending used.
  // 'lf': Line Feed only (\n), common on Linux and macOS as well as Git repos.
  // 'crlf': Carriage Return + Line Feed (\r\n), common on Windows.
  // 'cr': Carriage Return only (\r), rare.
  // 'auto': Maintain existing line endings.
  // Using 'lf' is generally recommended for cross-platform consistency.
  endOfLine: 'lf',

  // How to handle whitespaces in HTML, Vue, Angular, and JSX.
  // 'css': Respect the default value of CSS display property.
  // 'strict': Whitespaces are considered sensitive.
  // 'ignore': Whitespaces are considered insensitive.
  htmlWhitespaceSensitivity: 'css',

  // Whether to wrap markdown text.
  // 'always': Wrap prose if it exceeds the print width.
  // 'never': Do not wrap prose.
  // 'preserve': Wrap prose as-is.
  proseWrap: 'always', // Good for readable Markdown source
};
