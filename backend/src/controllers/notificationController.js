const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { paginate } = require('../utils/helpers');

async function listNotifications(req, res, next) {
  try {
    const { page, limit, skip } = paginate(req.query, req.query);
    const filter = {
      $or: [{ user: null }, { user: req.user._id }],
    };
    if (req.query.unread === 'true') filter.isRead = false;

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({
        $or: [{ user: null }, { user: req.user._id }],
        isRead: false,
      }),
    ]);

    sendSuccess(res, { items, total, page, limit, unreadCount });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) throw new AppError('Notification not found', 404);
    sendSuccess(res, { notification }, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany(
      { $or: [{ user: null }, { user: req.user._id }], isRead: false },
      { isRead: true }
    );
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotifications, markRead, markAllRead };
