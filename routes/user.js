// Routes /api/auth
const express = require('express');
const rateLimit = require('express-rate-limit');
const userCtrl = require('../controllers/user');

const router = express.Router();

// Anti force brute : 20 tentatives par IP toutes les 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Trop de tentatives, réessayez dans 15 minutes.' },
});

router.post('/signup', authLimiter, userCtrl.signup);
router.post('/login', authLimiter, userCtrl.login);

module.exports = router;
