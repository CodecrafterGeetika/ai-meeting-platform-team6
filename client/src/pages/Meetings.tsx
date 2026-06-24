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
  Clock, 
  User, 
  Briefcase, 
  X, 
  ChevronDown 
} from 'lucide-react';

const Meetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, scheduled, active, ended
  const [joinCode, setJoinCode] = useState('');
  
  // Custom workspace and summary states
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskModal, setTaskModal] = useState(null); // { text, meetingId }
  const [taskAssignee, setTaskAssignee] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const { user } = useAuth() as any;
  const navigate = useNavigate();

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  };

  const handleDirectCreateTask = async (taskTitle) => {
    try {
      const res = await api.post('/tasks', {
        title: taskTitle,
        meetingId: selectedMeeting.id || selectedMeeting._id
      });
      setTasks(prev => [res.data, ...prev]);
      alert('Task created successfully! You can now assign a team member inline.');
    } catch (err) {
      console.error('Failed to create task', err);
      alert('Failed to create task.');
    }
  };

  const handleAssigneeChange = async (taskId, assigneeId) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, {
        assignee: assigneeId || null
      });
      setTasks(prev => prev.map(t => (t.id === taskId || t._id === taskId ? res.data : t)));
    } catch (err) {
      console.error('Failed to update task assignee', err);
      alert('Failed to update assignee.');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users?limit=100');
      setUsers(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

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

  const handleGenerateSummary = async (meetingId) => {
    setGeneratingSummary(true);
    try {
      const res = await api.post(`/ai/${meetingId}/ai-summary`);
      alert('AI recap successfully generated!');
      // Update local state
      setMeetings(prev => prev.map(m => (m.id === meetingId || m._id === meetingId ? { ...m, summary: res.data.summary, actionItems: res.data.actionItems } : m)));
      setSelectedMeeting(prev => (prev.id === meetingId || prev._id === meetingId ? { ...prev, summary: res.data.summary, actionItems: res.data.actionItems } : prev));
    } catch (err) {
      console.error('Failed to generate summary', err);
      alert(err.response?.data?.message || 'Failed to generate summary.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskModal) return;
    setCreatingTask(true);
    try {
      await api.post('/tasks', {
        title: taskModal.text,
        meetingId: taskModal.meetingId,
        assignee: taskAssignee || undefined
      });
      alert('Action item successfully converted into a Kanban task!');
      setTaskModal(null);
      setTaskAssignee('');
    } catch (err) {
      console.error('Failed to convert action item to task', err);
      alert('Failed to create task.');
    } finally {
      setCreatingTask(false);
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
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight">My Meetings</h1>
          <p className="text-text-muted text-sm">Manage meetings, start conversations, and access history.</p>
        </div>
        
        {/* Search, Filter & New Meeting Controls */}
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          <form onSubmit={handleJoinByCode} className="flex items-stretch w-full sm:w-auto shrink-0">
            <input
              type="text"
              placeholder="Enter Room Code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="bg-input-bg border border-border-color px-4 text-sm text-text-main focus:outline-none focus:border-text-main w-full sm:w-44 focus:ring-1 focus:ring-text-main transition-all rounded-r-none! border-r-0!"
            />
            <button 
              type="submit" 
              className="bg-border-color hover:bg-text-muted hover:text-secondary-bg px-5 text-sm font-semibold transition-all cursor-pointer shrink-0 flex items-center justify-center text-text-main border border-border-color border-l-0 rounded-r-[14px] min-h-[46px]"
            >
              Join
            </button>
          </form>

          {/* Search Input */}
          <div className="relative flex items-center flex-1 sm:flex-initial w-full sm:w-48 shrink-0">
            <input 
              type="text"
              placeholder="Search title or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-input-bg border border-border-color rounded-xl pr-4 pl-10 text-sm text-text-main focus:outline-none focus:border-text-main w-full focus:ring-1 focus:ring-text-main transition-all"
            />
            <Search className="absolute left-[0.95rem] top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          </div>

          {/* Filter Dropdown */}
          <div className="relative flex items-center flex-1 sm:flex-initial w-full sm:w-auto shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-input-bg border border-border-color rounded-xl pl-4 pr-10 text-sm text-text-main focus:outline-none focus:border-text-main appearance-none cursor-pointer focus:ring-1 focus:ring-text-main transition-all w-full"
              style={{ minHeight: '46px' }}
            >
              <option value="all">All Status</option>
              <option value="scheduled">Upcoming</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={14} />
          </div>

          <Link to="/create" className="inline-flex items-center justify-center gap-2 bg-linear-to-br from-[#3f3f46] to-[#18181b] dark:from-[#f4f4f5] dark:to-[#a1a1aa] text-white dark:text-zinc-950 rounded-2xl font-semibold text-[0.95rem] px-7 py-3 relative overflow-hidden transition-all duration-300 shadow-md min-h-[46px] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 before:content-[''] before:absolute before:top-0 before:left-[-150%] before:w-full before:h-full before:bg-[linear-gradient(90deg,transparent,var(--shimmer-color),transparent)] before:transition-all before:duration-700 hover:before:left-[150%] cursor-pointer shrink-0 w-full sm:w-auto" style={{ minHeight: '46px' }}>
            <Plus size={16} />
            <span>New Meeting</span>
          </Link>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Meetings list */}
        <div className="lg:col-span-2 space-y-4 lg:max-h-[70vh] lg:overflow-y-auto pr-2">
          {loading ? (
            <div className="flex justify-center items-center py-20 bg-secondary-bg border border-border-color rounded-2xl">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-text-main"></div>
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="text-center py-20 bg-secondary-bg border border-border-color rounded-2xl shadow-sm">
              <Calendar size={48} className="mx-auto text-text-muted mb-3 opacity-60" />
              <h3 className="text-lg font-bold text-text-main">No meetings found</h3>
              <p className="text-sm text-text-muted mt-1">Try relaxing your filters or create a new meeting to start.</p>
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
                  className={`p-5 bg-secondary-bg border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-text-main bg-sidebar-active-bg shadow-md' 
                      : 'border-border-color hover:border-text-muted'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase rounded-full border ${
                        meeting.status === 'scheduled' 
                          ? 'bg-zinc-200/40 text-text-main border-border-color' 
                          : meeting.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-zinc-500/10 text-text-muted border-zinc-500/15'
                      }`}>
                        {meeting.status === 'scheduled' ? 'Upcoming' : meeting.status}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 bg-primary-bg border border-border-color text-text-muted rounded">
                        {meeting.meetingCode}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-text-main tracking-tight">{meeting.title}</h3>
                    
                    <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
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
                          ? 'bg-primary-bg text-text-muted border border-border-color cursor-not-allowed'
                          : meeting.status === 'active' 
                            ? 'bg-green-600 hover:bg-green-700 text-white font-bold'
                            : 'inline-flex items-center justify-center gap-2 bg-glass-bg border border-border-color text-text-main rounded-2xl font-semibold text-[0.95rem] px-6 py-2 transition-all duration-200 min-h-[46px] hover:bg-border-color hover:border-text-muted'
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
                        className="p-2.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 border border-transparent rounded-xl transition-all cursor-pointer"
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
            <div className="bg-secondary-bg border border-border-color rounded-3xl p-4 sm:p-8 shadow-card-shadow space-y-6">
              <div className="border-b border-border-color pb-4">
                <span className={`inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase rounded-full border mb-2 ${
                  selectedMeeting.status === 'scheduled' 
                    ? 'bg-zinc-200/40 text-text-main border-border-color' 
                    : selectedMeeting.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-zinc-500/10 text-text-muted border-zinc-500/15'
                }`}>
                  {selectedMeeting.status === 'scheduled' ? 'Upcoming' : selectedMeeting.status}
                </span>
                <h2 className="text-xl font-bold text-text-main tracking-tight mt-1">{selectedMeeting.title}</h2>
                <p className="text-xs font-mono text-text-muted mt-1 bg-primary-bg inline-block px-2.5 py-1 rounded border border-border-color">
                  Code: {selectedMeeting.meetingCode}
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Description</h4>
                <p className="text-sm text-text-main leading-relaxed">
                  {selectedMeeting.description || 'No description provided for this meeting.'}
                </p>
              </div>

              {/* Time Details */}
              <div className="grid grid-cols-2 gap-4 border-t border-b border-border-color py-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Scheduled Date</span>
                  <p className="text-sm font-semibold text-text-main">
                    {selectedMeeting.scheduledTime 
                      ? new Date(selectedMeeting.scheduledTime).toLocaleDateString(undefined, {dateStyle: 'medium'})
                      : 'Instant Room'
                    }
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Scheduled Time</span>
                  <p className="text-sm font-semibold text-text-main">
                    {selectedMeeting.scheduledTime 
                      ? new Date(selectedMeeting.scheduledTime).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'})
                      : 'Anytime'
                    }
                  </p>
                </div>
              </div>

              {/* Host info */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Host Details</h4>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-border-color flex items-center justify-center font-bold text-text-main text-xs">
                    {selectedMeeting.host?.name?.charAt(0).toUpperCase() || 'H'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-main">{selectedMeeting.host?.name || 'You'}</p>
                    <p className="text-xs text-text-muted">{selectedMeeting.host?.email || 'Host user'}</p>
                  </div>
                </div>
              </div>

              {/* AI Summary Section */}
              {selectedMeeting.summary && (
                <div className="space-y-2 border-t border-border-color pt-4 animate-fade-in">
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">AI Meeting Summary</h4>
                  <p className="text-xs text-text-main leading-relaxed bg-primary-bg p-4.5 rounded-2xl border border-border-color">
                    {selectedMeeting.summary}
                  </p>
                </div>
              )}

              {/* AI Action Items Section */}
              {selectedMeeting.actionItems && selectedMeeting.actionItems.length > 0 && (
                <div className="space-y-2 border-t border-border-color pt-4 animate-fade-in">
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">AI Action Items</h4>
                  <div className="space-y-2">
                    {selectedMeeting.actionItems.map((item, index) => {
                      const mId = selectedMeeting.id || selectedMeeting._id;
                      const associatedTask = tasks.find(t => 
                        t.title === item.text && 
                        (t.meetingId?._id === mId || t.meetingId?.id === mId || t.meetingId === mId)
                      );

                      return (
                        <div key={index} className="flex flex-col gap-3 p-4 bg-primary-bg rounded-xl border border-border-color text-xs shadow-sm">
                          <span className="text-text-main leading-relaxed wrap-break-word font-medium">{item.text}</span>
                          {associatedTask ? (
                            <div className="flex items-center gap-2 pt-2.5 border-t border-border-color/30 w-full justify-between shrink-0">
                              <span className="text-[10px] text-text-muted font-bold uppercase">Assignee:</span>
                              <div className="relative flex items-center">
                                <select
                                  value={associatedTask.assignee?.id || associatedTask.assignee?._id || associatedTask.assignee || ''}
                                  onChange={(e) => handleAssigneeChange(associatedTask.id || associatedTask._id, e.target.value)}
                                  className="bg-secondary-bg border border-border-color rounded-lg pl-2 pr-6 py-1.5 text-[11px] text-text-main focus:outline-none focus:border-text-main appearance-none cursor-pointer animate-fade-in"
                                >
                                  <option value="">Unassigned</option>
                                  {users.map(u => (
                                    <option key={u.id || u._id} value={u.id || u._id}>{u.name}</option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-1 text-text-muted pointer-events-none" size={12} />
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-end pt-2.5 border-t border-border-color/30 w-full shrink-0">
                              <button
                                type="button"
                                onClick={() => handleDirectCreateTask(item.text)}
                                className="px-3.5 py-1.5 bg-accent-color hover:bg-accent-hover text-primary-bg text-[10px] font-bold rounded-lg transition-all duration-200 cursor-pointer shadow-sm hover:-translate-y-0.5"
                              >
                                Convert to Task
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Generate AI Summary Button if transcript exists but no summary */}
              {selectedMeeting.transcript && !selectedMeeting.summary && (
                <div className="space-y-2 border-t border-border-color pt-4 text-center animate-fade-in">
                  <p className="text-xs text-text-muted">This meeting has a transcript but no summary generated yet.</p>
                  <button
                    type="button"
                    disabled={generatingSummary}
                    onClick={() => handleGenerateSummary(selectedMeeting.id || selectedMeeting._id)}
                    className="mt-2 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-accent-color text-primary-bg text-xs font-bold rounded-xl cursor-pointer hover:bg-accent-hover transition-all"
                  >
                    {generatingSummary ? 'Generating summary...' : 'Generate AI Summary'}
                  </button>
                </div>
              )}

              {/* Control Buttons */}
              <div className="space-y-3 pt-4 border-t border-border-color">
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
                      className="inline-flex items-center justify-center gap-2 bg-linear-to-br from-[#3f3f46] to-[#18181b] dark:from-[#f4f4f5] dark:to-[#a1a1aa] text-white dark:text-zinc-950 rounded-2xl font-semibold text-[0.95rem] px-7 py-3 relative overflow-hidden transition-all duration-300 shadow-md min-h-[46px] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 before:content-[''] before:absolute before:top-0 before:left-[-150%] before:w-full before:h-full before:bg-[linear-gradient(90deg,transparent,var(--shimmer-color),transparent)] before:transition-all before:duration-700 hover:before:left-[150%] cursor-pointer w-full"
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
                        className="w-full inline-flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 rounded-2xl font-semibold text-[0.95rem] px-6 py-3 transition-all duration-200 min-h-[46px] cursor-pointer"
                      >
                        <StopCircle size={18} />
                        <span>End Meeting</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="p-3 text-center text-sm font-semibold bg-primary-bg border border-border-color rounded-xl text-text-muted">
                    This meeting has ended.
                  </div>
                )}

                {/* Host Delete controls */}
                {(selectedMeeting.host?._id === user?.id || selectedMeeting.host?.id === user?.id || selectedMeeting.host === user?.id) && (
                  <button
                    onClick={() => handleDeleteMeeting(selectedMeeting.id || selectedMeeting._id)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-transparent text-text-muted hover:bg-red-500/10 hover:text-red-500 rounded-2xl font-semibold text-xs px-6 py-3 transition-all duration-200 min-h-[46px] cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Delete Schedule</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Empty State Details Pane */
            <div className="hidden lg:block bg-secondary-bg border border-border-color rounded-3xl p-8 shadow-card-shadow text-center py-16 space-y-4">
              <Calendar size={64} className="mx-auto text-text-muted opacity-50" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-text-main">Empty State</h3>
                <p className="text-sm text-text-muted leading-relaxed px-4">
                  No upcoming meetings scheduled. Click "New Meeting" to get started.
                </p>
              </div>
              <div className="pt-4">
                <Link to="/create" className="inline-flex items-center justify-center gap-2 bg-linear-to-br from-[#3f3f46] to-[#18181b] dark:from-[#f4f4f5] dark:to-[#a1a1aa] text-white dark:text-zinc-950 rounded-2xl font-semibold text-[0.95rem] px-7 py-3 relative overflow-hidden transition-all duration-300 shadow-md min-h-[46px] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 before:content-[''] before:absolute before:top-0 before:left-[-150%] before:w-full before:h-full before:bg-[linear-gradient(90deg,transparent,var(--shimmer-color),transparent)] before:transition-all before:duration-700 hover:before:left-[150%] cursor-pointer">
                  <Plus size={16} />
                  <span>Create Meeting</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Creation Modal */}
      {taskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fade-in">
          <div className="bg-glass-bg border border-border-color rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border-color bg-secondary-bg flex justify-between items-center">
              <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                <Briefcase size={20} />
                Convert to Kanban Task
              </h2>
              <button 
                type="button"
                onClick={() => setTaskModal(null)}
                className="p-1 hover:bg-border-color rounded-full text-text-muted hover:text-text-main bg-transparent border-none cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div className="m-0 mb-4">
                <label className="block text-xs font-bold text-text-muted mb-1.5 uppercase tracking-wider">Task Title</label>
                <input 
                  type="text"
                  required
                  value={taskModal.text}
                  onChange={(e) => setTaskModal({ ...taskModal, text: e.target.value })}
                  className="w-full bg-input-bg border border-border-color rounded-xl px-4 py-2.5 text-text-main focus:outline-none focus:border-text-main"
                />
              </div>

              <div className="m-0 mb-4">
                <label className="block text-xs font-bold text-text-muted mb-1.5 uppercase tracking-wider">Assignee</label>
                <div className="relative flex items-center w-full">
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full bg-input-bg border border-border-color rounded-xl pl-3 pr-10 py-2.5 text-sm text-text-main focus:outline-none focus:border-text-main appearance-none cursor-pointer focus:ring-1 focus:ring-text-main transition-all"
                    style={{ minHeight: '42px' }}
                  >
                    <option value="" className="bg-secondary-bg text-text-main">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id || u._id} value={u.id || u._id} className="bg-secondary-bg text-text-main">{u.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border-color">
                <button
                  type="button"
                  onClick={() => setTaskModal(null)}
                  className="inline-flex items-center justify-center gap-2 bg-glass-bg border border-border-color text-text-main rounded-2xl font-semibold text-xs px-5 py-2.5 transition-all duration-200 hover:bg-border-color hover:border-text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTask}
                  className="inline-flex items-center justify-center gap-2 bg-linear-to-br from-[#3f3f46] to-[#18181b] dark:from-[#f4f4f5] dark:to-[#a1a1aa] text-white dark:text-zinc-950 rounded-2xl font-semibold text-xs px-6 py-2.5 relative overflow-hidden transition-all duration-300 shadow-md hover:-translate-y-0.5"
                >
                  {creatingTask ? 'Converting...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;


