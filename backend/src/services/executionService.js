/**
 * executionService.js — JDoodle API backend (temporary)
 * Updated with robust JDoodle API key failover.
 */

const https = require('https');

const EXEC_TIMEOUT_MS = parseInt(process.env.EXEC_TIMEOUT_MS || '15000', 10);

const ACCOUNTS = [
  { id: process.env.JDOODLE_CLIENT_ID_1, secret: process.env.JDOODLE_CLIENT_SECRET_1, name: 'Account 1', exhaustedUntil: 0 },
  { id: process.env.JDOODLE_CLIENT_ID_2, secret: process.env.JDOODLE_CLIENT_SECRET_2, name: 'Account 2', exhaustedUntil: 0 },
].filter(a => a.id && a.secret);

// Fallback to legacy env vars if new ones are not set
if (ACCOUNTS.length === 0 && process.env.JDOODLE_CLIENT_ID && process.env.JDOODLE_CLIENT_SECRET) {
  ACCOUNTS.push({ id: process.env.JDOODLE_CLIENT_ID, secret: process.env.JDOODLE_CLIENT_SECRET, name: 'Legacy Account', exhaustedUntil: 0 });
}

if (ACCOUNTS.length === 0) {
  console.warn(
    'WARNING: JDoodle client credentials are not set in backend/.env. ' +
    'Code execution will be disabled until they are configured.'
  );
}

const COOLDOWN_PERIOD_MS = 60 * 60 * 1000; // 1 hour

const LANG_MAP = {
  // ── Popular ────────────────────────────────────────────────────────────────
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
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch (e) { reject(new Error('Parse error: ' + d.slice(0, 200))); }
      });
    });
    req.on('error', e => { clearTimeout(timer); reject(e); });
    req.write(data);
    req.end();
  });
}

function getAvailableAccount() {
  const now = Date.now();
  for (const account of ACCOUNTS) {
    if (account.exhaustedUntil < now) {
      return account;
    }
  }
  return null;
}

function markAccountExhausted(account) {
  console.log(`[JDoodle] ${account.name} quota/rate limit detected -> switching. Cooldown applied.`);
  account.exhaustedUntil = Date.now() + COOLDOWN_PERIOD_MS;
}

async function executeWithAccount(account, lang, code, stdin) {
  console.log(`[JDoodle] ${account.name} selected`);
  const response = await jdoodlePost({
    clientId: account.id,
    clientSecret: account.secret,
    script: code,
    stdin: stdin || '',
    language: lang.language,
    versionIndex: lang.versionIndex,
  });

  const result = response.data;
  
  // Distinguish between JDoodle API failures and actual code execution results.
  // JDoodle API failures (quota, unauthorized) often include an 'error' field or non-200 status.
  // Normal compilation/runtime errors appear in result.output, and result.error is absent.
  if (result.error || response.status !== 200) {
    throw new Error(`API Error: ${result.error || `HTTP ${response.status}`}`);
  }

  return {
    output: result.output || '',
    error: '',
    compilerMessage: '',
    exitCode: result.statusCode || 0,
    signal: null,
  };
}

async function run({ language, code, stdin = '' }) {
  const lang = LANG_MAP[language];
  if (!lang) throw new Error(`Unsupported language: ${language}`);

  if (ACCOUNTS.length === 0) {
    return { 
      output: '', 
      error: 'Code execution is disabled. Please configure JDoodle API keys in the backend/.env file to enable this feature.', 
      compilerMessage: '', 
      exitCode: 1, 
      signal: null 
    };
  }

  let lastError = null;

  for (let attempt = 0; attempt < ACCOUNTS.length; attempt++) {
    const account = getAvailableAccount();
    
    if (!account) {
      console.log(`[JDoodle] Both/all accounts unavailable.`);
      return { 
        output: '', 
        error: 'All JDoodle execution accounts are currently unavailable due to quota or rate-limits. Please try again later.', 
        compilerMessage: '', 
        exitCode: null, 
        signal: null 
      };
    }

    try {
      return await executeWithAccount(account, lang, code, stdin);
    } catch (err) {
      lastError = err;
      // Mark this account as exhausted and try the next one
      markAccountExhausted(account);
    }
  }

  return { 
    output: '', 
    error: `Execution API error after trying available accounts: ${lastError.message}`, 
    compilerMessage: '', 
    exitCode: null, 
    signal: null 
  };
}

module.exports = { run, _ACCOUNTS: ACCOUNTS };
