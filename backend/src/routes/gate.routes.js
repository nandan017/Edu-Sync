const router = require('express').Router();
const gate = require('../controllers/gate.controller');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/verify', authLimiter, gate.verifyGate);

module.exports = router;
