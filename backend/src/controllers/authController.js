const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

async function register(req, res, next) {
  try {
    const { name, email, password, role, phone } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw new AppError('Email already registered', 409);

    const allowedRoles = ['dispatcher', 'driver'];
    const safeRole = allowedRoles.includes(role) ? role : 'dispatcher';

    const user = await User.create({
      name,
      email,
      password,
      role: safeRole,
      phone,
    });

    const token = user.signToken();
    sendSuccess(
      res,
      {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
      'Registered successfully',
      201
    );
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password', 401);
    }
    if (!user.isActive) throw new AppError('Account is inactive', 403);

    const token = user.signToken();
    sendSuccess(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    }, 'Logged in successfully');
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  sendSuccess(res, { user: req.user });
}

module.exports = { register, login, me };
