/**
 * executeController.js — internal sandboxed execution.
 *
 * Wandbox has been removed. We now delegate to executionService which spawns
 * an isolated, resource-capped Docker container per request.
 *
 * Response shape is intentionally identical to the previous Wandbox version:
 *   { output, error, compilerMessage, exitCode, signal }
 * so the frontend (Room.jsx) and the Socket.io 'execution-result' relay keep
 * working without changes.
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

// Re-export normalizeLang and a LANG_MAP-shaped object so existing tests/imports
// continue to resolve. WANDBOX_LANG_MAP kept as an alias for backward compat.
module.exports = {
  executeCode,
  normalizeLang,
  WANDBOX_LANG_MAP: LANGS, // legacy export name
  LANGS,
};
