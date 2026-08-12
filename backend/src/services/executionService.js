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
  // ── Popular (original 7 kept at confirmed working versions) ────────────────
  javascript:   { language: 'nodejs',      versionIndex: '4' },
  python:       { language: 'python3',     versionIndex: '4' },
  java:         { language: 'java',        versionIndex: '4' },
  cpp:          { language: 'cpp17',       versionIndex: '1' },
  typescript:   { language: 'typescript',  versionIndex: '0' },
  go:           { language: 'go',          versionIndex: '4' },
  rust:         { language: 'rust',        versionIndex: '4' },

  // ── Popular (new) ──────────────────────────────────────────────────────────
  c:            { language: 'c',           versionIndex: '0' },
  csharp:       { language: 'csharp',      versionIndex: '0' },
  kotlin:       { language: 'kotlin',      versionIndex: '0' },
  swift:        { language: 'swift',       versionIndex: '0' },
  ruby:         { language: 'ruby',        versionIndex: '0' },
  php:          { language: 'php',         versionIndex: '0' },
  dart:         { language: 'dart',        versionIndex: '0' },

  // ── Scripting ──────────────────────────────────────────────────────────────
  bash:         { language: 'bash',        versionIndex: '0' },
  perl:         { language: 'perl',        versionIndex: '0' },
  lua:          { language: 'lua',         versionIndex: '0' },
  r:            { language: 'r',           versionIndex: '0' },
  coffeescript: { language: 'coffeescript', versionIndex: '0' },
  tcl:          { language: 'tcl',         versionIndex: '0' },
  octave:       { language: 'octave',      versionIndex: '0' },

  // ── Functional ─────────────────────────────────────────────────────────────
  haskell:      { language: 'haskell',     versionIndex: '0' },
  scala:        { language: 'scala',       versionIndex: '0' },
  elixir:       { language: 'elixir',      versionIndex: '0' },
  erlang:       { language: 'erlang',      versionIndex: '0' },
  clojure:      { language: 'clojure',     versionIndex: '0' },
  fsharp:       { language: 'fsharp',      versionIndex: '0' },
  ocaml:        { language: 'ocaml',       versionIndex: '0' },
  racket:       { language: 'racket',      versionIndex: '0' },
  scheme:       { language: 'scheme',      versionIndex: '0' },
  lisp:         { language: 'lisp',        versionIndex: '0' },
  sml:          { language: 'sml',         versionIndex: '0' },

  // ── Systems ────────────────────────────────────────────────────────────────
  nasm:         { language: 'nasm',        versionIndex: '0' },
  objectivec:   { language: 'objectivec',  versionIndex: '0' },
  d:            { language: 'd',           versionIndex: '0' },
  nim:          { language: 'nim',         versionIndex: '0' },
  zig:          { language: 'zig',         versionIndex: '0' },
  ada:          { language: 'ada',         versionIndex: '0' },
  fortran:      { language: 'fortran',     versionIndex: '0' },
  pascal:       { language: 'pascal',      versionIndex: '0' },
  cobol:        { language: 'cobol',       versionIndex: '0' },

  // ── JVM & .NET ─────────────────────────────────────────────────────────────
  groovy:       { language: 'groovy',      versionIndex: '0' },
  vb:           { language: 'vbn',         versionIndex: '0' },

  // ── Logic & Academic ───────────────────────────────────────────────────────
  prolog:       { language: 'prolog',      versionIndex: '0' },
  julia:        { language: 'julia',       versionIndex: '0' },
  crystal:      { language: 'crystal',     versionIndex: '0' },
  smalltalk:    { language: 'smalltalk',   versionIndex: '0' },
  factor:       { language: 'factor',      versionIndex: '0' },
  icon:         { language: 'icon',        versionIndex: '0' },
  pike:         { language: 'pike',        versionIndex: '0' },
  lolcode:      { language: 'lolcode',     versionIndex: '0' },
  brainfuck:    { language: 'brainfuck',   versionIndex: '0' },
  spidermonkey: { language: 'spidermonkey', versionIndex: '0' },

  // ── Database ───────────────────────────────────────────────────────────────
  sql:          { language: 'sql',         versionIndex: '0' },
  mongodb:      { language: 'mongodb',     versionIndex: '0' },
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
