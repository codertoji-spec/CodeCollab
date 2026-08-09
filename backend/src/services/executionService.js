/**
 * executionService.js — Piston API backend
 */

const https = require('https');

const EXEC_TIMEOUT_MS = parseInt(process.env.EXEC_TIMEOUT_MS || '15000', 10);

const LANG_MAP = {
  cpp:        { language: 'cpp',        version: '*' },
  javascript: { language: 'javascript', version: '*' },
  typescript: { language: 'typescript', version: '*' },
  python:     { language: 'python',     version: '*' },
  go:         { language: 'go',         version: '*' },
  rust:       { language: 'rust',       version: '*' },
  java:       { language: 'java',       version: '*' },
};

function pistonPost(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opts = {
      hostname: 'emkc.org',
      port: 443,
      path: '/api/v2/piston/execute',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const timer = setTimeout(() => reject(new Error('Piston execution timeout')), EXEC_TIMEOUT_MS);
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

  let result;
  try {
    result = await pistonPost({
      language: lang.language,
      version: lang.version,
      files: [{ content: code }],
      stdin: stdin || '',
    });
  } catch (err) {
    return { output: '', error: `Execution error: ${err.message}`, compilerMessage: '', exitCode: null, signal: null };
  }

  if (result.message) {
    // Usually a rate limit or bad request error from Piston
    return { output: '', error: result.message, compilerMessage: '', exitCode: null, signal: null };
  }

  // Piston returns .compile (optional) and .run
  const compileStage = result.compile || {};
  const runStage = result.run || {};

  let outputStr = '';
  let errorStr = '';
  let compilerMsg = compileStage.stderr || '';

  // If compilation failed entirely
  if (compileStage.code && compileStage.code !== 0) {
    errorStr = compileStage.stderr || 'Compilation failed.';
    return {
      output: '',
      error: errorStr,
      compilerMessage: compilerMsg,
      exitCode: compileStage.code,
      signal: compileStage.signal || null,
    };
  }

  // If execution ran
  outputStr = runStage.stdout || '';
  errorStr = runStage.stderr || '';
  const finalExitCode = runStage.code !== undefined ? runStage.code : 0;
  
  // Sometimes execution yields error output but exit code is 0 (like in python when printing to stderr)
  // Or sometimes it crashes. We'll return everything nicely formatted.
  return {
    output: outputStr,
    error: errorStr,
    compilerMessage: compilerMsg,
    exitCode: finalExitCode,
    signal: runStage.signal || null,
  };
}

module.exports = { run };
