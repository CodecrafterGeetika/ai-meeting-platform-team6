import httpStatus from 'http-status';
import Task from '../models/task.model.js';
import catchAsync from '../utils/catchAsync.js';
import Notification from '../models/notification.model.js';
import { sendLiveNotification } from '../services/socket.service.js';
import emailService from '../services/email.service.js';

const createTask = catchAsync(async (req, res) => {
  const taskData = {
    ...req.body,
    creator: req.user.id
  };
  const task = await Task.create(taskData);
  const populatedTask = await Task.findById(task.id).populate('assignee', 'name email avatar').populate('meetingId', 'title');

  // If assigned to a user (other than creator), create a notification
  if (populatedTask.assignee && populatedTask.assignee.id !== req.user.id) {
    const notification = await Notification.create({
      userId: populatedTask.assignee.id,
      title: 'New Task Assigned',
      message: `You have been assigned to task: "${populatedTask.title}" by ${req.user.name}.`,
      type: 'task_assigned'
    });
    // Send via socket
    sendLiveNotification(populatedTask.assignee.id, notification);

    // Send email notification to assignee
    try {
      const meetingTitle = populatedTask.meetingId?.title || 'an IntellMeet meeting';
      const emailSubject = `New Task Assigned: ${populatedTask.title}`;
      const emailBody = `Hi ${populatedTask.assignee.name},\n\nYou have been assigned a new task: "${populatedTask.title}" by ${req.user.name}.\nThis task was converted from action items in the meeting: "${meetingTitle}".\n\nPlease log in to the IntellMeet platform to view and track your task.`;
      
      await emailService.sendEmail(populatedTask.assignee.email, emailSubject, emailBody);
    } catch (emailErr) {
      console.error('Failed to send task assignment email:', emailErr);
    }
  }

  res.status(httpStatus.CREATED).json(populatedTask);
});

const getTasks = catchAsync(async (req, res) => {
  // Return all tasks where the user is either the creator or assignee
  const tasks = await Task.find({
    $or: [{ creator: req.user.id }, { assignee: req.user.id }]
  })
    .populate('assignee', 'name email avatar')
    .populate('meetingId', 'title')
    .sort({ createdAt: -1 });

  res.status(httpStatus.OK).json(tasks);
});

const updateTask = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    return res.status(httpStatus.NOT_FOUND).json({ message: 'Task not found' });
  }

  // Ensure user is creator or assignee to modify
  if (task.creator.toString() !== req.user.id && task.assignee?.toString() !== req.user.id) {
    return res.status(httpStatus.FORBIDDEN).json({ message: 'Unauthorized to update this task' });
  }

  const oldAssignee = task.assignee?.toString();

  // Update fields
  if (req.body.title !== undefined) task.title = req.body.title;
  if (req.body.description !== undefined) task.description = req.body.description;
  if (req.body.status !== undefined) task.status = req.body.status;
  if (req.body.assignee !== undefined) task.assignee = req.body.assignee || null;

  await task.save();
  const populatedTask = await Task.findById(task.id).populate('assignee', 'name email avatar').populate('meetingId', 'title');

  // Notify new assignee if changed
  if (populatedTask.assignee && populatedTask.assignee.id !== oldAssignee && populatedTask.assignee.id !== req.user.id) {
    const notification = await Notification.create({
      userId: populatedTask.assignee.id,
      title: 'New Task Assigned',
      message: `You have been assigned to task: "${populatedTask.title}" by ${req.user.name}.`,
      type: 'task_assigned'
    });
    sendLiveNotification(populatedTask.assignee.id, notification);

    // Send email notification to assignee
    try {
      const meetingTitle = populatedTask.meetingId?.title || 'an IntellMeet meeting';
      const emailSubject = `New Task Assigned: ${populatedTask.title}`;
      const emailBody = `Hi ${populatedTask.assignee.name},\n\nYou have been assigned a new task: "${populatedTask.title}" by ${req.user.name}.\nThis task was converted from action items in the meeting: "${meetingTitle}".\n\nPlease log in to the IntellMeet platform to view and track your task.`;
      
      await emailService.sendEmail(populatedTask.assignee.email, emailSubject, emailBody);
    } catch (emailErr) {
      console.error('Failed to send task assignment email:', emailErr);
    }
  }

  res.status(httpStatus.OK).json(populatedTask);
});

const deleteTask = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    return res.status(httpStatus.NOT_FOUND).json({ message: 'Task not found' });
  }

  // Only creator can delete
  if (task.creator.toString() !== req.user.id) {
    return res.status(httpStatus.FORBIDDEN).json({ message: 'Only the creator can delete this task' });
  }

  await task.deleteOne();
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createTask,
  getTasks,
  updateTask,
  deleteTask
};
