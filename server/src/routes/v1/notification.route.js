import express from 'express';
import auth from '../../middlewares/auth.js';
import notificationController from '../../controllers/notification.controller.js';

const router = express.Router();

router
  .route('/')
  .get(auth(), notificationController.getNotifications);

router
  .route('/mark-read')
  .put(auth(), notificationController.markAllAsRead);

router
  .route('/:id')
  .delete(auth(), notificationController.deleteNotification);

export default router;
