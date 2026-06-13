import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import aiService from '../services/ai.service.js';
import Meeting from '../models/meeting.model.js';

const generateSummary = catchAsync(async (req, res) => {
  const meeting = await Meeting.findById(req.params.meetingId);
  if (!meeting) {
    return res.status(httpStatus.NOT_FOUND).json({ message: 'Meeting not found' });
  }
  if (!meeting.transcript || meeting.transcript.trim().length === 0) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: 'No transcript available' });
  }

  const { summary, actionItems } = await aiService.analyzeMeeting(meeting.transcript);

  meeting.summary = summary;
  meeting.actionItems = actionItems.map((item) => ({
    text: item.text,
    completed: false,
  }));
  await meeting.save();

  res.status(httpStatus.OK).json({
    message: 'AI summary generated successfully',
    summary: meeting.summary,
    actionItems: meeting.actionItems,
  });
});

const saveTranscript = catchAsync(async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: 'Transcript is required' });
  }

  const meeting = await Meeting.findById(req.params.meetingId);
  if (!meeting) {
    return res.status(httpStatus.NOT_FOUND).json({ message: 'Meeting not found' });
  }

  meeting.transcript = transcript;
  await meeting.save();

  res.status(httpStatus.OK).json({ message: 'Transcript saved successfully' });
});

const testAI = catchAsync(async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: 'text field required' });
  }
  const summary = await aiService.generateMeetingSummary(text);
  res.status(httpStatus.OK).json({ summary });
});

export default { generateSummary, saveTranscript, testAI };