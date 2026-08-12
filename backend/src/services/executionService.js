/**
 * executionService.js — JDoodle API backend (temporary)
 */

const https = require('https');

const EXEC_TIMEOUT_MS = parseInt(process.env.EXEC_TIMEOUT_MS || '15000', 10);
const CLIENT_ID     = process.env.JDOODLE_CLIENT_ID;
const CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn(
    'WARNING: JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET are not set in backend/.env. ' +
    'Code execution will be disabled until they are configured.'
  );
}

const LANG_MAP = {
  // ── Popular ────────────────────────────────────────────────────────────────
  javascript:   { language: 'nodejs',      versionIndex: '4' },
  python:       { language: 'python3',     versionIndex: '4' },
  java:         { language: 'java',        versionIndex: '4' },
  cpp:          { language: 'cpp17',       versionIndex: '1' },
  c:            { language: 'c',           versionIndex: '5' },
  typescript:   { language: 'typescript',  versionIndex: '1' },
  csharp:       { language: 'csharp',      versionIndex: '4' },
  go:           { language: 'go',          versionIndex: '4' },
  rust:         { language: 'rust',        versionIndex: '4' },
  kotlin:       { language: 'kotlin',      versionIndex: '4' },
  swift:        { language: 'swift',       versionIndex: '4' },
  ruby:         { language: 'ruby',        versionIndex: '4' },
  php:          { language: 'php',         versionIndex: '4' },
  dart:         { language: 'dart',        versionIndex: '4' },

  // ── Scripting ──────────────────────────────────────────────────────────────
  bash:         { language: 'bash',        versionIndex: '4' },
  perl:         { language: 'perl',        versionIndex: '4' },
  lua:          { language: 'lua',         versionIndex: '3' },
  r:            { language: 'r',           versionIndex: '4' },
  coffeescript: { language: 'coffeescript', versionIndex: '4' },
  tcl:          { language: 'tcl',         versionIndex: '4' },
  octave:       { language: 'octave',      versionIndex: '4' },

  // ── Functional ─────────────────────────────────────────────────────────────
  haskell:      { language: 'haskell',     versionIndex: '4' },
  scala:        { language: 'scala',       versionIndex: '4' },
  elixir:       { language: 'elixir',      versionIndex: '4' },
  erlang:       { language: 'erlang',      versionIndex: '4' },
  clojure:      { language: 'clojure',     versionIndex: '4' },
  fsharp:       { language: 'fsharp',      versionIndex: '4' },
  ocaml:        { language: 'ocaml',       versionIndex: '4' },
  racket:       { language: 'racket',      versionIndex: '4' },
  scheme:       { language: 'scheme',      versionIndex: '4' },
  lisp:         { language: 'lisp',        versionIndex: '4' },
  sml:          { language: 'sml',         versionIndex: '1' },

  // ── Systems ────────────────────────────────────────────────────────────────
  nasm:         { language: 'nasm',        versionIndex: '4' },
  objectivec:   { language: 'objectivec',  versionIndex: '4' },
  d:            { language: 'd',           versionIndex: '4' },
  nim:          { language: 'nim',         versionIndex: '0' },
  zig:          { language: 'zig',         versionIndex: '0' },
  ada:          { language: 'ada',         versionIndex: '4' },
  fortran:      { language: 'fortran',     versionIndex: '4' },
  pascal:       { language: 'pascal',      versionIndex: '4' },
  cobol:        { language: 'cobol',       versionIndex: '4' },

  // ── JVM & .NET ─────────────────────────────────────────────────────────────
  groovy:       { language: 'groovy',      versionIndex: '4' },
  vb:           { language: 'vbn',         versionIndex: '4' },

  // ── Logic & Academic ───────────────────────────────────────────────────────
  prolog:       { language: 'prolog',      versionIndex: '4' },
  julia:        { language: 'julia',       versionIndex: '1' },
  crystal:      { language: 'crystal',     versionIndex: '0' },
  smalltalk:    { language: 'smalltalk',   versionIndex: '4' },
  factor:       { language: 'factor',      versionIndex: '0' },
  icon:         { language: 'icon',        versionIndex: '4' },
  pike:         { language: 'pike',        versionIndex: '2' },
  lolcode:      { language: 'lolcode',     versionIndex: '1' },
  brainfuck:    { language: 'brainfuck',   versionIndex: '1' },
  spidermonkey: { language: 'spidermonkey', versionIndex: '1' },

  // ── Database ───────────────────────────────────────────────────────────────
  sql:          { language: 'sql',         versionIndex: '4' },
  mongodb:      { language: 'mongodb',     versionIndex: '1' },
};

function jdoodlePost(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opts = {
      hostname: 'api.jdoodle.com',
      port: 443,
      path: '/v1/execute',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const timer = setTimeout(() => reject(new Error('JDoodle timeout')), EXEC_TIMEOUT_MS);
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        clearTimeout(timer);
        try { resolve(JSON.parse(d)); }
        catch (e) { reject(new Error('Parse error: ' + d.slice(0, 200))); }
      });
    });
    req.on('error', e => { clearTimeout(timer); reject(e); });
    req.write(data);
    req.end();
  });
}

async function run({ language, code, stdin = '' }) {
  const lang = LANG_MAP[language];
  if (!lang) throw new Error(`Unsupported language: ${language}`);

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return { 
      output: '', 
      error: 'Code execution is disabled. Please configure JDoodle API keys in the backend/.env file to enable this feature.', 
      compilerMessage: '', 
      exitCode: 1, 
      signal: null 
    };
  }

  let result;
  try {
    result = await jdoodlePost({
      clientId:     CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      script:       code,
      stdin:        stdin || '',
      language:     lang.language,
      versionIndex: lang.versionIndex,
    });
  } catch (err) {
    return { output: '', error: `Execution error: ${err.message}`, compilerMessage: '', exitCode: null, signal: null };
  }

  if (result.error) {
    return { output: '', error: result.error, compilerMessage: '', exitCode: null, signal: null };
  }

  return {
    output:          result.output || '',
    error:           '',
    compilerMessage: '',
    exitCode:        result.statusCode || 0,
    signal:          null,
  };
}

module.exports = { run };
