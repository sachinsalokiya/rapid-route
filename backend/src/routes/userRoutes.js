const express = require('express');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/', userController.listUsers);
router.post(
  '/',
  validate({
    name: { required: true, type: 'string' },
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string', minLength: 6 },
  }),
  userController.createUser
);
router.patch('/:id', userController.updateUser);

module.exports = router;
