import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Calendar, 
  Video, 
  Users, 
  Mail, 
  Plus, 
  X, 
  ChevronLeft,
  Check
} from 'lucide-react';

const CreateMeeting = () => {
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState({
    title: '',
    description: '',
    date: '',
    time: ''
  });
  
  // Custom interactive states
  const [enableTranscription, setEnableTranscription] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddParticipant = (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    if (!emailInput.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!participants.includes(emailInput.trim())) {
      setParticipants([...participants, emailInput.trim()]);
    }
    setEmailInput('');
  };

  const handleRemoveParticipant = (emailToRemove) => {
    setParticipants(participants.filter(p => p !== emailToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!meeting.title.trim()) return;
    
    setLoading(true);
    setError('');

    // Combine date and time into ISO string
    let scheduledTime = '';
    if (meeting.date && meeting.time) {
      scheduledTime = new Date(`${meeting.date}T${meeting.time}`).toISOString();
    } else if (meeting.date) {
      scheduledTime = new Date(meeting.date).toISOString();
    }

    try {
      await api.post('/meetings', {
        title: meeting.title,
        description: meeting.description,
        scheduledTime: scheduledTime || undefined,
        recordMeeting: false,
        enableTranscription
      });
      navigate('/meetings');
    } catch (err) {
      console.error('Failed to create meeting', err);
      setError(err.response?.data?.message || 'Failed to schedule meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 sm:px-8 space-y-6 animate-fade-in-up">
      {/* Back button & Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <button 
            onClick={() => navigate('/meetings')} 
            className="flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text-main transition-colors mb-2 bg-transparent border-none cursor-pointer"
          >
            <ChevronLeft size={16} />
            Back to Meetings
          </button>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight">Create New Meeting</h1>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl mb-6 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-secondary-bg border border-border-color rounded-3xl p-8 shadow-card-shadow space-y-5">
            <h3 className="text-lg font-bold text-text-main border-b border-border-color pb-3">
              Meeting Details
            </h3>

            {/* Title */}
            <div className="m-0 mb-5">
              <label className="block text-sm font-semibold text-text-muted mb-2">Meeting Title</label>
              <input 
                type="text"
                required
                value={meeting.title}
                onChange={(e) => setMeeting({ ...meeting, title: e.target.value })}
                placeholder="Weekly Product Sync"
                className="w-full bg-input-bg border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-text-main focus:ring-1 focus:ring-text-main transition-all"
              />
            </div>

            {/* Description */}
            <div className="m-0 mb-5">
              <label className="block text-sm font-semibold text-text-muted mb-2">Description</label>
              <textarea 
                value={meeting.description}
                onChange={(e) => setMeeting({ ...meeting, description: e.target.value })}
                placeholder="Add meeting agenda, documentation links, or notes..."
                rows={4}
                className="w-full bg-input-bg border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-text-main focus:ring-1 focus:ring-text-main transition-all resize-none"
              />
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="m-0">
                <label className="block text-sm font-semibold text-text-muted mb-2">Date</label>
                <input 
                  type="date"
                  value={meeting.date}
                  onChange={(e) => setMeeting({ ...meeting, date: e.target.value })}
                  className="w-full bg-input-bg border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-text-main transition-all"
                />
              </div>
              <div className="m-0">
                <label className="block text-sm font-semibold text-text-muted mb-2">Time</label>
                <input 
                  type="time"
                  value={meeting.time}
                  onChange={(e) => setMeeting({ ...meeting, time: e.target.value })}
                  className="w-full bg-input-bg border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-text-main transition-all"
                />
              </div>
            </div>

            {/* Participants Tag List */}
            <div className="m-0">
              <label className="block text-sm font-semibold text-text-muted mb-2">Participants</label>
              <div className="flex flex-wrap gap-2 p-2 min-h-[50px] bg-input-bg border border-border-color rounded-xl">
                {participants.length === 0 ? (
                  <span className="text-text-muted text-sm p-1">No participants added yet...</span>
                ) : (
                  participants.map((p, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary-bg border border-border-color text-text-main text-xs font-semibold rounded-full"
                    >
                      {p}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveParticipant(p)}
                        className="p-0.5 hover:bg-border-color rounded-full text-text-muted hover:text-red-500 bg-transparent border-none cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Options & Actions Sidebar */}
        <div className="space-y-6">
          {/* Preferences, Email invites */}
          <div className="bg-secondary-bg border border-border-color rounded-3xl p-4 sm:p-8 shadow-card-shadow space-y-6">
            <div className="space-y-4">
              <h3 className="text-md font-bold text-text-main">Preferences</h3>
              
              {/* Enable Transcription Toggle */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-text-main">Enable AI Transcription</h4>
                  <p className="text-xs text-text-muted">Automatically convert voice to text</p>
                </div>
                <div className="relative inline-block w-12 h-[26px] shrink-0">
                  <input 
                    type="checkbox" 
                    checked={enableTranscription}
                    onChange={(e) => setEnableTranscription(e.target.checked)}
                    className="sr-only peer"
                    id="transcription-toggle"
                  />
                  <label 
                    htmlFor="transcription-toggle"
                    className="absolute cursor-pointer inset-0 bg-border-color border border-border-color rounded-full transition-colors duration-300 peer-checked:bg-toggle-on-bg peer-checked:border-toggle-on-bg after:content-[''] after:absolute after:h-[18px] after:w-[18px] after:left-[3px] after:bottom-[3px] after:bg-toggle-thumb after:rounded-full after:shadow-md after:transition-transform after:duration-300 peer-checked:after:translate-x-[22px]"
                  />
                </div>
              </div>

            </div>

            {/* Invite Email Box */}
            <div className="border-t border-border-color pt-4">
              <h3 className="text-md font-bold text-text-main mb-2">Invite via Email</h3>
              <div className="flex items-stretch gap-2">
                <input 
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="collaborator@company.com"
                  className="flex-1 min-w-0 bg-input-bg border border-border-color rounded-xl px-3 py-2 text-sm text-text-main focus:outline-none focus:border-text-main"
                  style={{ minHeight: '46px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddParticipant(e);
                    }
                  }}
                />
                <button 
                  type="button"
                  onClick={handleAddParticipant}
                  className="w-[46px] h-[46px] flex items-center justify-center p-0 shrink-0 rounded-xl bg-border-color hover:bg-text-muted hover:text-secondary-bg text-text-main transition-all border-none cursor-pointer"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col gap-3">
            <button 
              type="submit" 
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-linear-to-br from-[#3f3f46] to-[#18181b] dark:from-[#f4f4f5] dark:to-[#a1a1aa] text-white dark:text-zinc-950 rounded-2xl font-semibold text-[0.95rem] px-7 py-3 relative overflow-hidden transition-all duration-300 shadow-md min-h-[46px] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 before:content-[''] before:absolute before:top-0 before:left-[-150%] before:w-full before:h-full before:bg-[linear-gradient(90deg,transparent,var(--shimmer-color),transparent)] before:transition-all before:duration-700 hover:before:left-[150%] cursor-pointer w-full"
            >
              {loading ? 'Scheduling...' : 'Schedule Meeting'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/meetings')}
              className="inline-flex items-center justify-center gap-2 bg-glass-bg border border-border-color text-text-main rounded-2xl font-semibold text-[0.95rem] px-6 py-3 transition-all duration-200 min-h-[46px] hover:bg-border-color hover:border-text-muted w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateMeeting;


