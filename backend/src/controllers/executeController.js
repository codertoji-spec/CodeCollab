/**
 * executeController.js — code execution via Piston's hosted API.
 *
 * executionService delegates each run to emkc.org/api/v2/piston/execute 
 * (free tier public endpoint). No sandboxing happens on this server — 
 * execution is fully outsourced to Piston's infrastructure.
 *
 * A self-hosted, per-language Docker sandbox was scoped (see
 * backend/sandbox/) but is not currently wired up — see backend/sandbox/README.md.
 *
 * Response shape: { output, error, compilerMessage, exitCode, signal }
 * — kept stable so the frontend (Room.jsx) and the Socket.io
 * 'execution-result' relay don't need to change if the execution backend
 * changes again in the future.
 */
const executionService = require('../services/executionService');
const { LANGS, normalizeLang } = require('../services/langConfig');

const executeCode = async (req, res) => {
  const { code, stdin } = req.body;
  const rawLang = req.body.language;
  const language = normalizeLang(rawLang);

  console.log(`[Execute] lang="${rawLang}" → normalized="${language}"`);

  if (!code || !language) {
    return res.status(400).json({ error: 'code and language required' });
  }
  if (typeof code !== 'string' || code.length > 100_000) {
    return res.status(400).json({ error: 'code must be a string up to 100000 chars' });
  }
  if (!LANGS[language]) {
    return res.status(400).json({
      error: `Unsupported language: ${language}`,
      supported: Object.keys(LANGS),
    });
  }

  try {
    const result = await executionService.run({
      language,
      code,
      stdin: typeof stdin === 'string' ? stdin.slice(0, 10_000) : '',
    });
    return res.json(result);
  } catch (err) {
    console.error('[Execute] internal error:', err.message);
    return res.status(500).json({ error: 'Code execution failed. Try again.' });
  }
};

module.exports = { executeCode, normalizeLang, LANGS };
