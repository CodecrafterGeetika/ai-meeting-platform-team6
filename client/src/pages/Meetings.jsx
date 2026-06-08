import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Video, 
  Trash2, 
  StopCircle, 
  PlayCircle, 
  Calendar, 
  Plus, 
  Search, 
  Filter,
  Info,
  Clock,
  User,
  Users,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

const Meetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, scheduled, active, ended
  const [joinCode, setJoinCode] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/meetings');
      setMeetings(res.data);
      if (res.data.length > 0) {
        setSelectedMeeting(res.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch meetings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = async (id) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;
    try {
      await api.delete(`/meetings/${id}`);
      const updated = meetings.filter(m => m.id !== id && m._id !== id);
      setMeetings(updated);
      if (selectedMeeting?.id === id || selectedMeeting?._id === id) {
        setSelectedMeeting(updated.length > 0 ? updated[0] : null);
      }
    } catch (error) {
      console.error('Failed to delete meeting', error);
    }
  };

  const handleStartMeeting = async (id) => {
    try {
      await api.post(`/meetings/${id}/start`);
      navigate(`/meeting-room/${id}`);
    } catch (error) {
      console.error('Failed to start meeting', error);
    }
  };

  const handleEndMeeting = async (id) => {
    try {
      await api.post(`/meetings/${id}/end`);
      fetchMeetings();
    } catch (error) {
      console.error('Failed to end meeting', error);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      const res = await api.post('/meetings/join', { meetingCode: joinCode });
      navigate(`/meeting-room/${res.data.id || res.data._id}`);
    } catch (error) {
      console.error('Failed to join meeting', error);
      alert(error.response?.data?.message || 'Failed to join meeting');
    }
  };

  // Filter meetings based on search query and status filter
  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (meeting.description && meeting.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          meeting.meetingCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || meeting.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full space-y-6 px-2 sm:px-6 py-2 animate-fade-in-up">
      {/* Meetings Top Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-(--text-main) tracking-tight">My Meetings</h1>
          <p className="text-(--text-muted) text-sm">Manage meetings, start conversations, and access history.</p>
        </div>
        
        {/* Search, Filter & New Meeting Controls */}
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          {/* Quick Join form */}
          <form onSubmit={handleJoinByCode} className="flex items-stretch w-full sm:w-auto shrink-0">
            <input
              type="text"
              placeholder="Enter Room Code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="bg-(--input-bg) border border-(--border-color) px-4 text-sm text-(--text-main) focus:outline-none focus:border-(--text-main) w-full sm:w-44"
              style={{ borderRadius: '14px 0 0 14px', borderRight: 'none', minHeight: '46px' }}
            />
            <button 
              type="submit" 
              className="bg-(--border-color) hover:bg-(--text-muted) hover:text-(--secondary-bg) px-5 text-sm font-semibold transition-all cursor-pointer shrink-0 flex items-center justify-center"
              style={{ borderRadius: '0 14px 14px 0', border: '1px solid var(--border-color)', borderLeft: 'none', minHeight: '46px' }}
            >
              Join
            </button>
          </form>

          {/* Search Input */}
          <div className="input-icon-wrapper flex-1 sm:flex-initial shrink-0">
            <input 
              type="text"
              placeholder="Search title or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-(--input-bg) border border-(--border-color) rounded-xl pr-4 text-sm text-(--text-main) focus:outline-none focus:border-(--text-main) w-full sm:w-48"
              style={{ minHeight: '46px' }}
            />
            <Search className="input-icon" size={16} />
          </div>

          {/* Filter Dropdown */}
          <div className="input-right-icon-wrapper shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-(--input-bg) border border-(--border-color) rounded-xl pl-4 text-sm text-(--text-main) focus:outline-none focus:border-(--text-main) appearance-none cursor-pointer"
              style={{ minHeight: '46px' }}
            >
              <option value="all">All Status</option>
              <option value="scheduled">Upcoming</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
            </select>
            <Filter className="input-icon" size={14} />
          </div>

          <Link to="/create" className="btn-metallic shrink-0" style={{ minHeight: '46px' }}>
            <Plus size={16} />
            <span>New Meeting</span>
          </Link>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Meetings list */}
        <div className="lg:col-span-2 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {loading ? (
            <div className="flex justify-center items-center py-20 bg-(--secondary-bg) border border-(--border-color) rounded-2xl">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-(--text-main)"></div>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="text-center py-20 bg-(--secondary-bg) border border-(--border-color) rounded-2xl shadow-sm">
              <Calendar size={48} className="mx-auto text-(--text-muted) mb-3 opacity-60" />
              <h3 className="text-lg font-bold text-(--text-main)">No meetings found</h3>
              <p className="text-sm text-(--text-muted) mt-1">Try relaxing your filters or create a new meeting to start.</p>
            </div>
          ) : (
            filteredMeetings.map((meeting) => {
              const mId = meeting.id || meeting._id;
              const isSelected = selectedMeeting?.id === mId || selectedMeeting?._id === mId;
              const isHost = meeting.host?._id === user?.id || meeting.host?.id === user?.id || meeting.host === user?.id;
              
              return (
                <div 
                  key={mId} 
                  onClick={() => setSelectedMeeting(meeting)}
                  className={`p-5 bg-(--secondary-bg) border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-(--text-main) bg-(--sidebar-active-bg) shadow-md' 
                      : 'border-(--border-color) hover:border-(--text-muted)'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`status-pill ${meeting.status === 'scheduled' ? 'upcoming' : meeting.status}`}>
                        {meeting.status === 'scheduled' ? 'Upcoming' : meeting.status}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 bg-(--primary-bg) border border-(--border-color) text-(--text-muted) rounded">
                        {meeting.meetingCode}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-(--text-main) tracking-tight">{meeting.title}</h3>
                    
                    <div className="flex items-center gap-4 text-xs text-(--text-muted) flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {meeting.scheduledTime 
                          ? new Date(meeting.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                          : 'Instant Meeting'
                        }
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        Host: {meeting.host?.name || 'You'}
                      </span>
                    </div>
                  </div>

                  {/* Actions inside list card */}
                  <div className="flex items-center gap-3 self-end md:self-auto border-t md:border-none pt-3 md:pt-0">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (meeting.status !== 'ended') {
                          if (isHost && meeting.status === 'scheduled') {
                            handleStartMeeting(mId);
                          } else {
                            navigate(`/meeting-room/${mId}`);
                          }
                        }
                      }}
                      disabled={meeting.status === 'ended'}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        meeting.status === 'ended' 
                          ? 'bg-(--primary-bg) text-(--text-muted) border border-(--border-color) cursor-not-allowed'
                          : meeting.status === 'active' 
                            ? 'bg-green-600 hover:bg-green-700 text-white font-bold'
                            : 'btn-glass py-2'
                      }`}
                    >
                      {meeting.status === 'ended' ? 'Ended' : meeting.status === 'active' ? 'Join Now' : (isHost ? 'Start' : 'Join')}
                    </button>
                    
                    {isHost && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMeeting(mId);
                        }}
                        className="p-2.5 text-(--text-muted) hover:text-red-500 hover:bg-red-500/10 border border-transparent rounded-xl transition-all cursor-pointer"
                        title="Delete Meeting"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Meeting Details / Calendar Empty State */}
        <div className="lg:col-span-1">
          {selectedMeeting ? (
            <div className="premium-card space-y-6">
              <div className="border-b border-(--border-color) pb-4">
                <span className={`status-pill mb-2 ${selectedMeeting.status === 'scheduled' ? 'upcoming' : selectedMeeting.status}`}>
                  {selectedMeeting.status === 'scheduled' ? 'Upcoming' : selectedMeeting.status}
                </span>
                <h2 className="text-xl font-bold text-(--text-main) tracking-tight mt-1">{selectedMeeting.title}</h2>
                <p className="text-xs font-mono text-(--text-muted) mt-1 bg-(--primary-bg) inline-block px-2.5 py-1 rounded border border-(--border-color)">
                  Code: {selectedMeeting.meetingCode}
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">Description</h4>
                <p className="text-sm text-(--text-main) leading-relaxed">
                  {selectedMeeting.description || 'No description provided for this meeting.'}
                </p>
              </div>

              {/* Time Details */}
              <div className="grid grid-cols-2 gap-4 border-t border-b border-(--border-color) py-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">Scheduled Date</span>
                  <p className="text-sm font-semibold text-(--text-main)">
                    {selectedMeeting.scheduledTime 
                      ? new Date(selectedMeeting.scheduledTime).toLocaleDateString(undefined, {dateStyle: 'medium'})
                      : 'Instant Room'
                    }
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">Scheduled Time</span>
                  <p className="text-sm font-semibold text-(--text-main)">
                    {selectedMeeting.scheduledTime 
                      ? new Date(selectedMeeting.scheduledTime).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'})
                      : 'Anytime'
                    }
                  </p>
                </div>
              </div>

              {/* Host info */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">Host Details</h4>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-(--border-color) flex items-center justify-center font-bold text-(--text-main) text-xs">
                    {selectedMeeting.host?.name?.charAt(0).toUpperCase() || 'H'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-(--text-main)">{selectedMeeting.host?.name || 'You'}</p>
                    <p className="text-xs text-(--text-muted)">{selectedMeeting.host?.email || 'Host user'}</p>
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="space-y-3 pt-4 border-t border-(--border-color)">
                {selectedMeeting.status !== 'ended' ? (
                  <>
                    <button
                      onClick={() => {
                        const isHost = selectedMeeting.host?._id === user?.id || selectedMeeting.host?.id === user?.id || selectedMeeting.host === user?.id;
                        const mId = selectedMeeting.id || selectedMeeting._id;
                        if (isHost && selectedMeeting.status === 'scheduled') {
                          handleStartMeeting(mId);
                        } else {
                          navigate(`/meeting-room/${mId}`);
                        }
                      }}
                      className="btn-metallic w-full"
                    >
                      <PlayCircle size={18} />
                      <span>
                        {selectedMeeting.status === 'active' 
                          ? 'Join Room' 
                          : (selectedMeeting.host?._id === user?.id || selectedMeeting.host?.id === user?.id || selectedMeeting.host === user?.id 
                              ? 'Start Meeting' 
                              : 'Join Meeting'
                            )
                        }
                      </span>
                    </button>

                    {/* End meeting button for active status */}
                    {selectedMeeting.status === 'active' && (selectedMeeting.host?._id === user?.id || selectedMeeting.host?.id === user?.id || selectedMeeting.host === user?.id) && (
                      <button
                        onClick={() => handleEndMeeting(selectedMeeting.id || selectedMeeting._id)}
                        className="btn-glass w-full text-red-500 border-red-500/20 hover:bg-red-500/10 justify-center"
                      >
                        <StopCircle size={18} />
                        <span>End Meeting</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="p-3 text-center text-sm font-semibold bg-(--primary-bg) border border-(--border-color) rounded-xl text-(--text-muted)">
                    This meeting has ended.
                  </div>
                )}

                {/* Host Delete controls */}
                {(selectedMeeting.host?._id === user?.id || selectedMeeting.host?.id === user?.id || selectedMeeting.host === user?.id) && (
                  <button
                    onClick={() => handleDeleteMeeting(selectedMeeting.id || selectedMeeting._id)}
                    className="btn-glass w-full border-none hover:bg-red-500/10 hover:text-red-500 justify-center text-xs text-(--text-muted)"
                  >
                    <Trash2 size={14} />
                    <span>Delete Schedule</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Empty State Details Pane */
            <div className="premium-card text-center py-16 space-y-4">
              <Calendar size={64} className="mx-auto text-(--text-muted) opacity-50" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-(--text-main)">Empty State</h3>
                <p className="text-sm text-(--text-muted) leading-relaxed px-4">
                  No upcoming meetings scheduled. Click "New Meeting" to get started.
                </p>
              </div>
              <div className="pt-4">
                <Link to="/create" className="btn-metallic inline-flex">
                  <Plus size={16} />
                  <span>Create Meeting</span>
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Meetings;


