require('dotenv').config();
const validateEnv = require('./src/config/env');
const connectDB = require('./src/config/database');
const app = require('./src/app');

// Validate environment variables
validateEnv();

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🚀 Edu-Sync Backend running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/v1/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
};

start().catch(err => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
