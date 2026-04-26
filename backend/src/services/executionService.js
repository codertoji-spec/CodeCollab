/**
 * executionService.js — JDoodle API backend (temporary)
 */

const https = require('https');

const EXEC_TIMEOUT_MS = parseInt(process.env.EXEC_TIMEOUT_MS || '15000', 10);
const CLIENT_ID     = process.env.JDOODLE_CLIENT_ID     || 'd98c07546c906707c837873dacb29390';
const CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET || 'fe9be6191e9abc1cc718729628d0edbd0f0ed0579c266216b4b7d7b0dbf1d31c';

const LANG_MAP = {
  cpp:        { language: 'cpp17',      versionIndex: '1' },
  javascript: { language: 'nodejs',     versionIndex: '4' },
  typescript: { language: 'typescript', versionIndex: '4' },
  python:     { language: 'python3',    versionIndex: '4' },
  go:         { language: 'go',         versionIndex: '4' },
  rust:       { language: 'rust',       versionIndex: '4' },
  java:       { language: 'java',       versionIndex: '4' },
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
