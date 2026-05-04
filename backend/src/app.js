const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const path = require('path');
const { generalLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const principalRoutes = require('./routes/principal.routes');
const hodRoutes = require('./routes/hod.routes');
const facultyRoutes = require('./routes/faculty.routes');
const studentRoutes = require('./routes/student.routes');

const app = express();

// ─── Security Middleware ───
app.use(helmet());
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  credentials: true,
}));
app.use(mongoSanitize());
app.use(generalLimiter);

// ─── Body Parsing ───
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Static Files (uploads) ───
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// ─── Health Check ───
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'Edu-Sync API is running', timestamp: new Date().toISOString() });
});

// ─── API Routes ───
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/principal', principalRoutes);
app.use('/api/v1/hod', hodRoutes);
app.use('/api/v1/faculty', facultyRoutes);
app.use('/api/v1/student', studentRoutes);

// ─── 404 Handler ───
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ─── Global Error Handler ───
app.use((err, req, res, _next) => {
  console.error('❌ Error:', err.message);
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Internal server error' });
});

module.exports = app;
