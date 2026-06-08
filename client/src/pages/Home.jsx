import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/meetings');
      setMeetings(res.data);
    } catch (error) {
      console.error('Failed to fetch meetings for dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingCount = meetings.filter(m => m.status === 'scheduled' || m.status === 'active').length;
  const finishedCount = meetings.filter(m => m.status === 'ended').length;
  const totalMinutes = finishedCount * 45 + (upcomingCount > 0 ? 30 : 0); // simulated minutes

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      const res = await api.post('/meetings/join', { meetingCode: joinCode });
      navigate(`/meeting-room/${res.data.id || res.data._id}`);
    } catch (error) {
      console.error('Failed to join meeting', error);
      alert(error.response?.data?.message || 'Failed to join meeting. Please check the code.');
    }
  };

  // Simulated AI insights for high-fidelity UI
  const recentInsights = [
    {
      id: 1,
      meetingTitle: 'Product Sync & Design Alignment',
      date: 'Today, 2:30 PM',
      icon: MessageSquare,
      summary: 'Action items: Alex to finalize gray color tokens. Sarah to review WebRTC video layout.'
    },
    {
      id: 2,
      meetingTitle: 'AI Roadmap Discussion',
      date: 'Yesterday, 10:00 AM',
      icon: Brain,
      summary: 'Summary: Discussed NLP pipelines, GPT integration. Agreed to start backend implementation in Sprint 4.'
    }
  ];

  return (
    <div className="w-full space-y-8 animate-fade-in-up">
      {/* Dashboard Top Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-(--text-main) tracking-tight">IntellMeet Dashboard</h1>
          <p className="text-(--text-muted) text-sm">Real-time collaboration and AI-generated insights at a glance.</p>
        </div>
        <Link to="/create" className="btn-metallic">
          <Plus size={18} />
          <span>Create Meeting</span>
        </Link>
      </div>

      {/* Row of Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="premium-card flex justify-between items-center group cursor-pointer hover:border-(--text-muted) transition-all">
          <div className="space-y-2">
            <p className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">Upcoming Meetings</p>
            <h2 className="text-4xl font-extrabold text-(--text-main)">{loading ? '...' : upcomingCount}</h2>
          </div>
          <button 
            onClick={() => navigate('/meetings')}
            className="p-3 bg-(--primary-bg) group-hover:bg-(--border-color) text-(--text-main) rounded-xl transition-all border-none cursor-pointer flex items-center justify-center"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Metric 2 */}
        <div className="premium-card flex justify-between items-center group cursor-pointer hover:border-(--text-muted) transition-all">
          <div className="space-y-2">
            <p className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">Minutes Transcribed</p>
            <h2 className="text-4xl font-extrabold text-(--text-main)">{loading ? '...' : totalMinutes.toLocaleString()}</h2>
          </div>
          <button className="p-3 bg-(--primary-bg) text-(--text-main) rounded-xl border-none cursor-default flex items-center justify-center">
            <Clock size={18} />
          </button>
        </div>

        {/* Metric 3 */}
        <div className="premium-card flex justify-between items-center group cursor-pointer hover:border-(--text-muted) transition-all">
          <div className="space-y-2">
            <p className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">Recent AI Insights</p>
            <h2 className="text-4xl font-extrabold text-(--text-main)">
              {loading ? '...' : (finishedCount * 3 + 2)} <span className="text-sm font-semibold text-(--text-muted)">items</span>
            </h2>
          </div>
          <button className="p-3 bg-(--primary-bg) text-(--text-main) rounded-xl border-none cursor-default flex items-center justify-center">
            <Brain size={18} />
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent AI Insights Feed */}
        <div className="lg:col-span-1 space-y-6">
          <div className="premium-card space-y-5 h-full">
            <h3 className="text-lg font-bold text-(--text-main) border-b border-(--border-color) pb-3">
              Recent AI Insights
            </h3>
            
            <div className="space-y-4">
              {recentInsights.map((insight) => {
                const Icon = insight.icon;
                return (
                  <div 
                    key={insight.id} 
                    className="p-4 bg-(--primary-bg) border border-(--border-color) rounded-2xl space-y-2 hover:border-(--text-muted) transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-(--secondary-bg) border border-(--border-color) text-(--text-main) rounded-lg">
                        <Icon size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-(--text-main) line-clamp-1">{insight.meetingTitle}</h4>
                        <p className="text-[10px] text-(--text-muted)">{insight.date}</p>
                      </div>
                    </div>
                    <p className="text-xs text-(--text-muted) leading-relaxed">
                      {insight.summary}
                    </p>
                  </div>
                );
              })}

              <div className="p-4 bg-(--primary-bg) border border-(--border-color) rounded-2xl flex items-center justify-between hover:border-(--text-muted) transition-all cursor-pointer">
                <div className="flex items-center gap-2">
                  <CheckSquare size={18} className="text-(--text-muted)" />
                  <span className="text-xs font-bold text-(--text-main)">Total Pending Tasks</span>
                </div>
                <span className="text-xs font-bold bg-(--secondary-bg) border border-(--border-color) px-2.5 py-1 rounded-lg text-(--text-main)">
                  7 action items
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Quick Actions */}
        <div className="lg:col-span-1">
          <div className="premium-card space-y-5 h-full">
            <h3 className="text-lg font-bold text-(--text-main) border-b border-(--border-color) pb-3">
              Quick Actions
            </h3>

            <div className="flex flex-col gap-3">
              <Link to="/create" className="btn-metallic w-full py-3">
                <Plus size={18} />
                <span>Schedule Meeting</span>
              </Link>

              <Link to="/meetings" className="btn-glass w-full py-3 justify-center">
                <Calendar size={18} />
                <span>View Past Meetings</span>
              </Link>

              <button 
                onClick={() => alert('Recording upload module coming soon.')}
                className="btn-glass w-full py-3 justify-center cursor-pointer bg-transparent border border-(--border-color) hover:border-(--text-muted) text-(--text-main)"
              >
                <Upload size={18} />
                <span>Upload Recording</span>
              </button>

              <button 
                onClick={() => setShowJoinModal(true)}
                className="btn-glass w-full py-3 justify-center cursor-pointer bg-transparent border border-(--border-color) hover:border-(--text-muted) text-(--text-main)"
              >
                <Video size={18} />
                <span>Join with Code</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Meetings list */}
        <div className="lg:col-span-1">
          <div className="premium-card space-y-5 h-full">
            <h3 className="text-lg font-bold text-(--text-main) border-b border-(--border-color) pb-3">
              Recent Meetings
            </h3>

            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-(--text-main)"></div>
                </div>
              ) : meetings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-(--text-muted)">No meetings scheduled yet.</p>
                </div>
              ) : (
                meetings.slice(0, 4).map((meeting) => {
                  const mId = meeting.id || meeting._id;
                  const isHost = meeting.host?._id === user?.id || meeting.host?.id === user?.id || meeting.host === user?.id;
                  
                  return (
                    <div 
                      key={mId} 
                      className="p-3 bg-(--primary-bg) border border-(--border-color) rounded-2xl flex items-center justify-between hover:border-(--text-muted) transition-all cursor-pointer"
                      onClick={() => navigate('/meetings')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-(--secondary-bg) border border-(--border-color) flex items-center justify-center text-(--text-main) font-extrabold text-sm">
                          {meeting.title.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-(--text-main) line-clamp-1">{meeting.title}</h4>
                          <p className="text-[10px] text-(--text-muted)">
                            {meeting.scheduledTime 
                              ? new Date(meeting.scheduledTime).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})
                              : 'Instant Meeting'
                            }
                          </p>
                        </div>
                      </div>

                      <span className={`status-pill ${meeting.status === 'scheduled' ? 'upcoming' : meeting.status}`}>
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
          <div className="bg-(--glass-bg) border border-(--border-color) rounded-3xl w-full max-w-md shadow-2xl animate-fade-in-up overflow-hidden">
            <div className="p-6 border-b border-(--border-color) bg-(--secondary-bg) flex justify-between items-center">
              <h2 className="text-xl font-bold text-(--text-main) flex items-center gap-2">
                <Video size={22} />
                Join Room with Code
              </h2>
              <button 
                onClick={() => setShowJoinModal(false)}
                className="p-1 hover:bg-(--border-color) rounded-full text-(--text-muted) hover:text-(--text-main) bg-transparent border-none cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleJoinByCode} className="p-6 space-y-4">
              <div className="form-group m-0">
                <label className="block text-sm font-semibold text-(--text-muted) mb-2">Meeting Code</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. abc-defg-hij"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full bg-(--input-bg) border border-(--border-color) rounded-xl px-4 py-3 text-(--text-main) focus:outline-none focus:border-(--text-main) focus:ring-1 focus:ring-(--text-main) transition-all"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-(--border-color)">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="btn-glass py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-metallic py-2"
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


