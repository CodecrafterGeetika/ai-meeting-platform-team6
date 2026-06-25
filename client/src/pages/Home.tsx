import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Video, 
  Calendar, 
  Clock, 
  Brain, 
  ChevronRight, 
  Plus, 
  CheckSquare, 
  Upload, 
  FileText,
  UserCheck,
  MessageSquare,
  X
} from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [meetingsRes, tasksRes] = await Promise.all([
        api.get('/meetings'),
        api.get('/tasks')
      ]);
      setMeetings(meetingsRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingCount = meetings.filter(m => m.status === 'scheduled' || m.status === 'active').length;
  const finishedCount = meetings.filter(m => m.status === 'ended').length;
  const totalMinutes = finishedCount * 45; 

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      const res = await api.post('/meetings/join', { meetingCode: joinCode });
      navigate(`/meeting-room/${res.data.id || res.data._id}`);
    } catch (error) {
      console.error('Failed to join meeting', error);
      toast.error(error.response?.data?.message || 'Failed to join meeting. Please check the code.');
    }
  };

  // Extract actual insights from summarized meetings in database
  const recentInsights = meetings
    .filter(m => m.summary)
    .slice(0, 3)
    .map((m) => ({
      id: m.id || m._id,
      meetingTitle: m.title,
      date: m.scheduledTime 
        ? new Date(m.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
        : 'Instant Meeting',
      icon: Brain,
      summary: m.summary
    }));

  return (
    <div className="w-full space-y-8 animate-fade-in-up">
      {/* Dashboard Top Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight">IntellMeet Dashboard</h1>
          <p className="text-text-muted text-sm">Real-time collaboration and AI-generated insights at a glance.</p>
        </div>
        <Link to="/create" className="inline-flex items-center justify-center gap-2 bg-linear-to-br from-[#3f3f46] to-[#18181b] dark:from-[#f4f4f5] dark:to-[#a1a1aa] text-white dark:text-zinc-950 rounded-2xl font-semibold text-[0.95rem] px-7 py-3 relative overflow-hidden transition-all duration-300 shadow-md min-h-[46px] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 before:content-[''] before:absolute before:top-0 before:left-[-150%] before:w-full before:h-full before:bg-[linear-gradient(90deg,transparent,var(--shimmer-color),transparent)] before:transition-all before:duration-700 hover:before:left-[150%] cursor-pointer">
          <Plus size={18} />
          <span>Create Meeting</span>
        </Link>
      </div>

      {/* Row of Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="bg-secondary-bg border border-border-color rounded-3xl p-8 shadow-card-shadow flex justify-between items-center group cursor-pointer hover:border-text-muted transition-all">
          <div className="space-y-2">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Upcoming Meetings</p>
            <h2 className="text-4xl font-extrabold text-text-main">{loading ? '...' : upcomingCount}</h2>
          </div>
          <button 
            onClick={() => navigate('/meetings')}
            className="p-3 bg-primary-bg group-hover:bg-border-color text-text-main rounded-xl transition-all border-none cursor-pointer flex items-center justify-center"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Metric 2 */}
        <div className="bg-secondary-bg border border-border-color rounded-3xl p-8 shadow-card-shadow flex justify-between items-center group cursor-pointer hover:border-text-muted transition-all">
          <div className="space-y-2">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Minutes Transcribed</p>
            <h2 className="text-4xl font-extrabold text-text-main">{loading ? '...' : totalMinutes.toLocaleString()}</h2>
          </div>
          <button className="p-3 bg-primary-bg text-text-main rounded-xl border-none cursor-default flex items-center justify-center">
            <Clock size={18} />
          </button>
        </div>

        {/* Metric 3 */}
        <div className="bg-secondary-bg border border-border-color rounded-3xl p-8 shadow-card-shadow flex justify-between items-center group cursor-pointer hover:border-text-muted transition-all" onClick={() => navigate('/meetings')}>
          <div className="space-y-2">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Recent AI Insights</p>
            <h2 className="text-4xl font-extrabold text-text-main">
              {loading ? '...' : recentInsights.length} <span className="text-sm font-semibold text-text-muted">recap{recentInsights.length === 1 ? '' : 's'}</span>
            </h2>
          </div>
          <button className="p-3 bg-primary-bg text-text-main rounded-xl border-none cursor-default flex items-center justify-center">
            <Brain size={18} />
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent AI Insights Feed */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-secondary-bg border border-border-color rounded-3xl p-8 shadow-card-shadow space-y-5 h-full">
            <h3 className="text-lg font-bold text-text-main border-b border-border-color pb-3">
              Recent AI Insights
            </h3>
            
            <div className="space-y-4">
              {recentInsights.length === 0 ? (
                <div className="text-center py-6 text-xs text-text-muted/60 italic">
                  No meeting recaps available yet. Transcribe and summarize a meeting to generate insights.
                </div>
              ) : (
                recentInsights.map((insight) => {
                  const Icon = insight.icon;
                  return (
                    <div 
                      key={insight.id} 
                      className="p-4 bg-primary-bg border border-border-color rounded-2xl space-y-2 hover:border-text-muted transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-secondary-bg border border-border-color text-text-main rounded-lg">
                          <Icon size={16} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-text-main line-clamp-1">{insight.meetingTitle}</h4>
                          <p className="text-[10px] text-text-muted">{insight.date}</p>
                        </div>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                        {insight.summary}
                      </p>
                    </div>
                  );
                })
              )}

              <div 
                className="p-4 bg-primary-bg border border-border-color rounded-2xl flex items-center justify-between hover:border-text-muted transition-all cursor-pointer"
                onClick={() => navigate('/workspace')}
              >
                <div className="flex items-center gap-2">
                  <CheckSquare size={18} className="text-text-muted" />
                  <span className="text-xs font-bold text-text-main">Total Pending Tasks</span>
                </div>
                <span className="text-xs font-bold bg-secondary-bg border border-border-color px-2.5 py-1 rounded-lg text-text-main">
                  {loading ? '...' : tasks.filter(t => t.status !== 'done').length} task{tasks.filter(t => t.status !== 'done').length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-secondary-bg border border-border-color rounded-3xl p-8 shadow-card-shadow space-y-5 h-full">
            <h3 className="text-lg font-bold text-text-main border-b border-border-color pb-3">
              Quick Actions
            </h3>

            <div className="flex flex-col gap-3">
              <Link to="/create" className="inline-flex items-center justify-center gap-2 bg-linear-to-br from-[#3f3f46] to-[#18181b] dark:from-[#f4f4f5] dark:to-[#a1a1aa] text-white dark:text-zinc-950 rounded-2xl font-semibold text-[0.95rem] px-7 py-3 relative overflow-hidden transition-all duration-300 shadow-md min-h-[46px] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 before:content-[''] before:absolute before:top-0 before:left-[-150%] before:w-full before:h-full before:bg-[linear-gradient(90deg,transparent,var(--shimmer-color),transparent)] before:transition-all before:duration-700 hover:before:left-[150%] cursor-pointer w-full">
                <Plus size={18} />
                <span>Schedule Meeting</span>
              </Link>

              <Link to="/meetings" className="inline-flex items-center justify-center gap-2 bg-glass-bg border border-border-color text-text-main rounded-2xl font-semibold text-[0.95rem] px-6 py-3 transition-all duration-200 min-h-[46px] hover:bg-border-color hover:border-text-muted w-full">
                <Calendar size={18} />
                <span>View Past Meetings</span>
              </Link>

              <button 
                onClick={() => toast.success('Recording upload module coming soon.')}
                className="inline-flex items-center justify-center gap-2 bg-glass-bg border border-border-color text-text-main rounded-2xl font-semibold text-[0.95rem] px-6 py-3 transition-all duration-200 min-h-[46px] hover:bg-border-color hover:border-text-muted w-full cursor-pointer"
              >
                <Upload size={18} />
                <span>Upload Recording</span>
              </button>

              <button 
                onClick={() => setShowJoinModal(true)}
                className="inline-flex items-center justify-center gap-2 bg-glass-bg border border-border-color text-text-main rounded-2xl font-semibold text-[0.95rem] px-6 py-3 transition-all duration-200 min-h-[46px] hover:bg-border-color hover:border-text-muted w-full cursor-pointer"
              >
                <Video size={18} />
                <span>Join with Code</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Meetings list */}
        <div className="lg:col-span-1">
          <div className="bg-secondary-bg border border-border-color rounded-3xl p-8 shadow-card-shadow space-y-5 h-full">
            <h3 className="text-lg font-bold text-text-main border-b border-border-color pb-3">
              Recent Meetings
            </h3>

            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-text-main"></div>
                </div>
              ) : meetings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-text-muted">No meetings scheduled yet.</p>
                </div>
              ) : (
                meetings.slice(0, 4).map((meeting) => {
                  const mId = meeting.id || meeting._id;
                  
                  return (
                    <div 
                      key={mId} 
                      className="p-3 bg-primary-bg border border-border-color rounded-2xl flex items-center justify-between hover:border-text-muted transition-all cursor-pointer"
                      onClick={() => navigate('/meetings')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary-bg border border-border-color flex items-center justify-center text-text-main font-extrabold text-sm">
                          {meeting.title.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-text-main line-clamp-1">{meeting.title}</h4>
                          <p className="text-[10px] text-text-muted">
                            {meeting.scheduledTime 
                              ? new Date(meeting.scheduledTime).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})
                              : 'Instant Meeting'
                            }
                          </p>
                        </div>
                      </div>

                      <span className={`inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase rounded-full border ${
                        meeting.status === 'scheduled' 
                          ? 'bg-zinc-200/40 text-text-main border-border-color' 
                          : meeting.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-zinc-500/10 text-text-muted border-zinc-500/15'
                      }`}>
                        {meeting.status === 'scheduled' ? 'Upcoming' : meeting.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Join Code Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-glass-bg border border-border-color rounded-3xl w-full max-w-md shadow-2xl animate-fade-in-up overflow-hidden">
            <div className="p-6 border-b border-border-color bg-secondary-bg flex justify-between items-center">
              <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                <Video size={22} />
                Join Room with Code
              </h2>
              <button 
                onClick={() => setShowJoinModal(false)}
                className="p-1 hover:bg-border-color rounded-full text-text-muted hover:text-text-main bg-transparent border-none cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleJoinByCode} className="p-6 space-y-4">
              <div className="mb-5">
                <label className="block text-sm font-semibold text-text-muted mb-2">Meeting Code</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. abc-defg-hij"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full bg-input-bg border border-border-color rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-text-main focus:ring-1 focus:ring-text-main transition-all"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-border-color">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="inline-flex items-center justify-center gap-2 bg-glass-bg border border-border-color text-text-main rounded-2xl font-semibold text-[0.95rem] px-6 py-3 transition-all duration-200 min-h-[46px] hover:bg-border-color hover:border-text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 bg-linear-to-br from-[#3f3f46] to-[#18181b] dark:from-[#f4f4f5] dark:to-[#a1a1aa] text-white dark:text-zinc-950 rounded-2xl font-semibold text-[0.95rem] px-7 py-3 relative overflow-hidden transition-all duration-300 shadow-md min-h-[46px] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 before:content-[''] before:absolute before:top-0 before:left-[-150%] before:w-full before:h-full before:bg-[linear-gradient(90deg,transparent,var(--shimmer-color),transparent)] before:transition-all before:duration-700 hover:before:left-[150%] cursor-pointer"
                >
                  Join Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;


