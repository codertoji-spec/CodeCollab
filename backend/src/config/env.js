/**
 * env.js — Environment variable validation.
 * Fails safely and informs developers when critical configuration is missing.
 */
const requiredEnv = ['JWT_SECRET'];

const validateEnv = () => {
  const missing = requiredEnv.filter(k => !process.env[k]);
  if (missing.length > 0) {
    const errorMsg = `[Config Error] Missing required environment variable(s): ${missing.join(', ')}`;
    console.error(errorMsg);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg);
    }
  }
};

module.exports = { validateEnv };
