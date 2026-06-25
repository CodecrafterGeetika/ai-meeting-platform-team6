import express from 'express';
import auth from '../../middlewares/auth.js';
import taskController from '../../controllers/task.controller.js';

const router = express.Router();

router
  .route('/')
  .post(auth(), taskController.createTask)
  .get(auth(), taskController.getTasks);

router
  .route('/:taskId')
  .put(auth(), taskController.updateTask)
  .delete(auth(), taskController.deleteTask);

export default router;
