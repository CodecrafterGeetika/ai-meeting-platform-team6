import httpStatus from 'http-status';
import Notification from '../models/notification.model.js';
import catchAsync from '../utils/catchAsync.js';

const getNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20);

  res.status(httpStatus.OK).json(notifications);
});

const markAllAsRead = catchAsync(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.id, unread: true },
    { $set: { unread: false } }
  );

  res.status(httpStatus.OK).json({ message: 'All notifications marked as read' });
});

const deleteNotification = catchAsync(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, userId: req.user.id });
  if (!notification) {
    return res.status(httpStatus.NOT_FOUND).json({ message: 'Notification not found' });
  }

  await notification.deleteOne();
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  getNotifications,
  markAllAsRead,
  deleteNotification
};
