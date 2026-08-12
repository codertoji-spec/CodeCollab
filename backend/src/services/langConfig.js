/**
 * Supported languages for code execution.
 *
 * Execution itself happens via JDoodle's hosted API (see
 * services/executionService.js) — this file only tracks which language
 * keys are valid and normalizes aliases/casing for the incoming request.
 */
const LANGS = {
  // ── Popular ────────────────────────────────────────────────────────────────
  javascript: true,
  python: true,
  java: true,
  cpp: true,
  c: true,
  typescript: true,
  csharp: true,
  go: true,
  rust: true,
  kotlin: true,
  swift: true,
  ruby: true,
  php: true,
  dart: true,

  // ── Scripting ──────────────────────────────────────────────────────────────
  bash: true,
  perl: true,
  lua: true,
  r: true,
  coffeescript: true,
  tcl: true,
  octave: true,

  // ── Functional ─────────────────────────────────────────────────────────────
  haskell: true,
  scala: true,
  elixir: true,
  erlang: true,
  clojure: true,
  fsharp: true,
  ocaml: true,
  racket: true,
  scheme: true,
  lisp: true,
  sml: true,

  // ── Systems ────────────────────────────────────────────────────────────────
  nasm: true,
  objectivec: true,
  d: true,
  nim: true,
  zig: true,
  ada: true,
  fortran: true,
  pascal: true,
  cobol: true,

  // ── JVM & .NET ─────────────────────────────────────────────────────────────
  groovy: true,
  vb: true,

  // ── Logic & Academic ───────────────────────────────────────────────────────
  prolog: true,
  julia: true,
  crystal: true,
  smalltalk: true,
  factor: true,
  icon: true,
  pike: true,
  lolcode: true,
  brainfuck: true,
  spidermonkey: true,

  // ── Database ───────────────────────────────────────────────────────────────
  sql: true,
};

const ALIASES = {
  js: 'javascript', node: 'javascript', nodejs: 'javascript',
  ts: 'typescript',
  py: 'python', python3: 'python',
  'c++': 'cpp', cxx: 'cpp', cc: 'cpp',
  golang: 'go',
  rs: 'rust',
  'c#': 'csharp', cs: 'csharp', dotnet: 'csharp',
  kt: 'kotlin',
  rb: 'ruby',
  sh: 'bash', shell: 'bash',
  pl: 'perl',
  hs: 'haskell',
  fs: 'fsharp', 'f#': 'fsharp',
  ml: 'ocaml',
  asm: 'nasm', assembly: 'nasm',
  objc: 'objectivec', 'objective-c': 'objectivec',
  bf: 'brainfuck',
  'vb.net': 'vb', vbnet: 'vb',
};

const normalizeLang = (lang) => {
  if (!lang) return null;
  const k = String(lang).trim().toLowerCase();
  return ALIASES[k] || k;
};

module.exports = { LANGS, normalizeLang };