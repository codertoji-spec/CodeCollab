/**
 * executionService.js — Judge0 CE public API (temporary)
 */

const https = require('https');

const EXEC_TIMEOUT_MS = parseInt(process.env.EXEC_TIMEOUT_MS || '15000', 10);
const JUDGE0_HOST = process.env.JUDGE0_HOST || 'judge0-ce.p.rapidapi.com';
const JUDGE0_KEY  = process.env.JUDGE0_KEY  || '';

// Judge0 language IDs
const LANG_IDS = {
  cpp:        54,  // C++ 17 (GCC 7.4.0) — supports threads, semaphores
  javascript: 63,  // Node.js 12.14.0
  typescript: 74,  // TypeScript 3.7.4
  python:     71,  // Python 3.8.1
  go:         60,  // Go 1.13.5
  rust:       73,  // Rust 1.40.0
  java:       62,  // Java OpenJDK 13.0.1
};

function post(path, body, headers) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opts = {
      hostname: JUDGE0_HOST,
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
    };
    const timer = setTimeout(() => reject(new Error('Judge0 timeout')), EXEC_TIMEOUT_MS);
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { clearTimeout(timer); try { resolve(JSON.parse(d)); } catch(e) { reject(new Error('Parse error: ' + d.slice(0,200))); } });
    });
    req.on('error', e => { clearTimeout(timer); reject(e); });
    req.write(data);
    req.end();
  });
}

function get(path, headers) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: JUDGE0_HOST, port: 443, path, method: 'GET', headers };
    const timer = setTimeout(() => reject(new Error('Judge0 timeout')), EXEC_TIMEOUT_MS);
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { clearTimeout(timer); try { resolve(JSON.parse(d)); } catch(e) { reject(new Error('Parse error: ' + d.slice(0,200))); } });
    });
    req.on('error', e => { clearTimeout(timer); reject(e); });
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run({ language, code, stdin = '' }) {
  const langId = LANG_IDS[language];
  if (!langId) throw new Error(`Unsupported language: ${language}`);

  const headers = JUDGE0_KEY ? {
    'X-RapidAPI-Host': JUDGE0_HOST,
    'X-RapidAPI-Key': JUDGE0_KEY,
  } : {};

  // Submit
  let submission;
  try {
    submission = await post('/submissions?base64_encoded=false&wait=false', {
      language_id: langId,
      source_code: code,
      stdin: stdin || '',
    }, headers);
  } catch (err) {
    return { output: '', error: `Submission error: ${err.message}`, compilerMessage: '', exitCode: null, signal: null };
  }

  if (!submission.token) {
    return { output: '', error: `Judge0 error: ${JSON.stringify(submission)}`, compilerMessage: '', exitCode: null, signal: null };
  }

  // Poll until done
  let result;
  for (let i = 0; i < 20; i++) {
    await sleep(800);
    try {
      result = await get(`/submissions/${submission.token}?base64_encoded=false`, headers);
      if (result.status && result.status.id > 2) break; // not queued/processing
    } catch (err) {
      return { output: '', error: `Poll error: ${err.message}`, compilerMessage: '', exitCode: null, signal: null };
    }
  }

  if (!result) return { output: '', error: 'Execution timed out', compilerMessage: '', exitCode: null, signal: null };

  const output = result.stdout || '';
  const error  = result.stderr || '';
  const compilerMessage = result.compile_output || '';
  const exitCode = result.exit_code ?? null;

  return { output, error, compilerMessage, exitCode, signal: null };
}

module.exports = { run };
