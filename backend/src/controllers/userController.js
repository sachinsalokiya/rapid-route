const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { paginate } = require('../utils/helpers');

async function listUsers(req, res, next) {
  try {
    const { page, limit, skip } = paginate(req.query, req.query);
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.q) {
      filter.$or = [
        { name: new RegExp(req.query.q, 'i') },
        { email: new RegExp(req.query.q, 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    sendSuccess(res, { items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const updates = {};
    ['name', 'phone', 'role', 'isActive'].forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) throw new AppError('User not found', 404);
    sendSuccess(res, { user }, 'User updated');
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, role, phone } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw new AppError('Email already registered', 409);

    const user = await User.create({ name, email, password, role: role || 'dispatcher', phone });
    sendSuccess(
      res,
      { user: { id: user._id, name: user.name, email: user.email, role: user.role } },
      'User created',
      201
    );
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, updateUser, createUser };
