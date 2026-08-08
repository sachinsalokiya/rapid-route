const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  validate({
    name: { required: true, type: 'string', minLength: 2 },
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string', minLength: 6 },
  }),
  authController.register
);

router.post(
  '/login',
  validate({
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string', minLength: 6 },
  }),
  authController.login
);

router.get('/me', protect, authController.me);

module.exports = router;
