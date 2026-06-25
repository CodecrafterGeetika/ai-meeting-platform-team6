import { setServers } from 'node:dns/promises';
setServers(['1.1.1.1', '8.8.8.8']);
import mongoose from 'mongoose';

const actionItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completed: { type: Boolean, default: false }
});

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    status: {
      type: String,
      enum: ['scheduled', 'active', 'ended'],
      default: 'scheduled'
    },
    meetingCode: {
      type: String,
      unique: true
    },
    scheduledTime: {
      type: Date
    },
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    recording: {
      type: String,
      default: ''
    },
    recordMeeting: {
      type: Boolean,
      default: false
    },
    enableTranscription: {
      type: Boolean,
      default: true
    },
    transcript: {
      type: String,
      default: ''
    },
    summary: {
      type: String,
      default: ''
    },
    actionItems: [actionItemSchema]
  },
  { timestamps: true }
);

// Auto generate meeting code before saving
meetingSchema.pre('save', function (next) {
  if (!this.meetingCode) {
    this.meetingCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  next();
});

const Meeting = mongoose.model('Meeting', meetingSchema);
export default Meeting;
