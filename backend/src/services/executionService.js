/**
 * executionService.js — Wandbox HTTP backend (temporary)
 * Drop-in replacement for the Docker-based runner.
 * Same exported interface: run({ language, code, stdin }) → { output, error, compilerMessage, exitCode, signal }
 */

const https = require('https');

const EXEC_TIMEOUT_MS = parseInt(process.env.EXEC_TIMEOUT_MS || '15000', 10);

// Map our lang keys → Wandbox compiler names
const WANDBOX_COMPILERS = {
  cpp:        'gcc-head',        // C++20/23, GCC latest
  javascript: 'nodejs-head',
  typescript: 'typescript-5.4.5',
  python:     'cpython-3.12.3',
  go:         'go-head',
  rust:       'rust-head',
  java:       'openjdk-head',
};

const WANDBOX_OPTIONS = {
  cpp: 'warning,c++20',
  rust: '',
  java: '',
  javascript: '',
  typescript: '',
  python: '',
  go: '',
};

function wandboxRequest(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: 'wandbox.org',
      port: 443,
      path: '/api/compile.json',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'CodeCollab/1.0',
      },
    };

    const timer = setTimeout(() => reject(new Error('Wandbox timeout')), EXEC_TIMEOUT_MS);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        clearTimeout(timer);
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Wandbox parse error: ' + data.slice(0, 200))); }
      });
    });

    req.on('error', (e) => { clearTimeout(timer); reject(e); });
    req.write(body);
    req.end();
  });
}

async function run({ language, code, stdin = '' }) {
  const compiler = WANDBOX_COMPILERS[language];
  if (!compiler) throw new Error(`Unsupported language: ${language}`);

  const payload = {
    compiler,
    code,
    stdin: stdin || '',
    'compiler-option-raw': WANDBOX_OPTIONS[language] || '',
    save: false,
  };

  let result;
  try {
    result = await wandboxRequest(payload);
  } catch (err) {
    return {
      output: '',
      error: `Execution engine error: ${err.message}`,
      compilerMessage: '',
      exitCode: null,
      signal: null,
    };
  }

  // Wandbox response fields:
  // status, compiler_output, compiler_error, program_output, program_error, signal
  const compilerMessage = [result.compiler_output, result.compiler_error]
    .filter(Boolean).join('\n').trim();

  const output = result.program_output || '';
  const error  = result.program_error  || '';
  const exitCode = result.status !== undefined ? parseInt(result.status, 10) : null;
  const signal = result.signal || null;

  return { output, error, compilerMessage, exitCode, signal };
}

module.exports = { run };
