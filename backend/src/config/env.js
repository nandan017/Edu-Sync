const required = ['MONGODB_URI', 'JWT_SECRET', 'CREDENTIAL_ENCRYPTION_KEY'];

const validateEnv = () => {
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.error(`❌ Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
};

module.exports = validateEnv;
