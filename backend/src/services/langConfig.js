/**
 * Supported languages for code execution.
 *
 * Execution itself happens via JDoodle's hosted API (see
 * services/executionService.js) — this file only tracks which language
 * keys are valid and normalizes aliases/casing for the incoming request.
 *
 * A per-language Docker sandbox (image build + compile/run commands per
 * language) was scoped as a future self-hosted alternative to JDoodle —
 * see backend/sandbox/README.md. That config lived here previously but
 * was never read by the current execution path, so it's been removed to
 * avoid implying this server spawns containers when it doesn't.
 */
const LANGS = {
  javascript: true,
  typescript: true,
  python: true,
  cpp: true,
  go: true,
  rust: true,
  java: true,
};

const ALIASES = {
  js: 'javascript', node: 'javascript', nodejs: 'javascript',
  ts: 'typescript',
  py: 'python', python3: 'python',
  'c++': 'cpp', cxx: 'cpp', cc: 'cpp',
  golang: 'go',
  rs: 'rust',
  java: 'java',
};

const normalizeLang = (lang) => {
  if (!lang) return null;
  const k = String(lang).trim().toLowerCase();
  return ALIASES[k] || k;
};

module.exports = { LANGS, normalizeLang };