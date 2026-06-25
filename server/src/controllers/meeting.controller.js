import httpStatus from 'http-status';
import fs from 'fs';
import catchAsync from '../utils/catchAsync.js';
import meetingService from '../services/meeting.service.js';
import aiService from '../services/ai.service.js';
import Notification from '../models/notification.model.js';
import { sendLiveNotification } from '../services/socket.service.js';

const createMeeting = catchAsync(async (req, res) => {
  const meeting = await meetingService.createMeeting(req.body, req.user);
  res.status(httpStatus.CREATED).json(meeting);
});

const getMeetings = catchAsync(async (req, res) => {
  const meetings = await meetingService.getMeetings(req.user.id);
  res.status(httpStatus.OK).json(meetings);
});

const getMeeting = catchAsync(async (req, res) => {
  const meeting = await meetingService.getMeetingById(req.params.meetingId);
  res.status(httpStatus.OK).json(meeting);
});

const updateMeeting = catchAsync(async (req, res) => {
  const meeting = await meetingService.updateMeeting(
    req.params.meetingId,
    req.body,
    req.user.id
  );
  res.status(httpStatus.OK).json(meeting);
});

const deleteMeeting = catchAsync(async (req, res) => {
  await meetingService.deleteMeeting(req.params.meetingId, req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const joinMeeting = catchAsync(async (req, res) => {
  const meeting = await meetingService.joinMeeting(
    req.body.meetingCode,
    req.user.id
  );
  res.status(httpStatus.OK).json(meeting);
});

const startMeeting = catchAsync(async (req, res) => {
  const meeting = await meetingService.startMeeting(
    req.params.meetingId,
    req.user.id
  );
  res.status(httpStatus.OK).json(meeting);
});

const endMeeting = catchAsync(async (req, res) => {
  const meeting = await meetingService.endMeeting(
    req.params.meetingId,
    req.user.id
  );
  res.status(httpStatus.OK).json(meeting);
});

const transcribeMeeting = catchAsync(async (req, res) => {
  const meeting = await meetingService.getMeetingById(req.params.meetingId);
  if (!meeting) {
    return res.status(httpStatus.NOT_FOUND).json({ message: 'Meeting not found' });
  }

  if (!req.file) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: 'Audio file is required' });
  }

  try {
    const transcriptText = await aiService.transcribeAudio(req.file.path);
    meeting.transcript = transcriptText;

    const { summary, actionItems } = await aiService.analyzeMeeting(transcriptText);
    meeting.summary = summary;
    meeting.actionItems = actionItems.map((item) => ({
      text: item.text,
      completed: false
    }));

    await meeting.save();

    const hostId = meeting.host._id || meeting.host.id || meeting.host;
    const notification = await Notification.create({
      userId: hostId,
      title: 'AI Recap Ready',
      message: `AI transcription and summary for "${meeting.title}" are now available.`,
      type: 'ai_summary'
    });

    sendLiveNotification(hostId, notification);

    res.status(httpStatus.OK).json({
      message: 'Meeting transcription and analysis completed successfully',
      transcript: meeting.transcript,
      summary: meeting.summary,
      actionItems: meeting.actionItems
    });
  } catch (error) {
    console.error('Transcription failed:', error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Transcription process failed: ' + error.message });
  } finally {
    try {
      await fs.promises.unlink(req.file.path);
    } catch (err) {
      console.error('Failed to delete temp file:', err);
    }
  }
});

export default {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting,
  joinMeeting,
  startMeeting,
  endMeeting,
  transcribeMeeting
};
