const router = require('express').Router();
const auth = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, auth.login);
router.post('/register', authLimiter, auth.register);
router.post('/logout', auth.logout);
router.post('/refresh', auth.refresh);

module.exports = router;
