import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Trash2,  
  Video, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Clock,
  Play,
  Briefcase,
  X,
  ChevronDown
} from 'lucide-react';

const Workspace = () => {
  const { user } = useAuth() as any;
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee: '',
    meetingId: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, usersRes, meetingsRes] = await Promise.allSettled([
        api.get('/tasks'),
        api.get('/users?limit=100'),
        api.get('/meetings')
      ]);

      if (tasksRes.status === 'fulfilled') {
        setTasks(tasksRes.value.data);
      } else {
        console.error('Error fetching tasks:', tasksRes.reason);
      }

      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.data.results || usersRes.value.data || []);
      } else {
        console.error('Error fetching users:', usersRes.reason);
      }

      if (meetingsRes.status === 'fulfilled') {
        setMeetings(meetingsRes.value.data || []);
      } else {
        console.error('Error fetching meetings:', meetingsRes.reason);
      }
    } catch (error) {
      console.error('Error fetching workspace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    setFormLoading(true);
    try {
      const res = await api.post('/tasks', {
        title: newTask.title,
        description: newTask.description,
        assignee: newTask.assignee || undefined,
        meetingId: newTask.meetingId || undefined
      });
      setTasks(prev => [res.data, ...prev]);
      setShowAddModal(false);
      setNewTask({ title: '', description: '', assignee: '', meetingId: '' });
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => (t.id === taskId || t._id === taskId ? res.data : t)));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId && t._id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  const renderTaskCard = (task) => {
    const tId = task.id || task._id;
    const isCreator = task.creator === user?.id || task.creator?._id === user?.id || task.creator === user?._id;

    return (
      <div 
        key={tId} 
        className="p-4 sm:p-5 bg-secondary-bg border border-border-color rounded-2xl shadow-sm hover:shadow-md hover:border-text-muted transition-all duration-200 flex flex-col gap-3 group animate-slide-up relative"
      >
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-sm font-bold text-text-main leading-snug truncate pr-6" title={task.title}>{task.title}</h4>
          {isCreator && (
            <button 
              onClick={() => handleDeleteTask(tId)}
              className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded text-text-muted transition-all border-none bg-transparent cursor-pointer absolute right-3 top-3 opacity-0 group-hover:opacity-100"
              title="Delete task"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {task.description && (
          <p className="text-xs text-text-muted leading-relaxed line-clamp-3">{task.description}</p>
        )}

        {task.meetingId && (
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-accent-color bg-accent-color/5 border border-accent-color/10 px-2.5 py-1 rounded-lg w-fit">
            <Video size={11} className="shrink-0" />
            <span className="truncate max-w-[120px]">{task.meetingId.title}</span>
          </div>
        )}

        <div className="flex justify-between items-center border-t border-border-color/50 pt-3 mt-1">
          {/* Assignee display */}
          <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
            {task.assignee ? (
              <>
                {task.assignee.avatar ? (
                  <img src={task.assignee.avatar} alt={task.assignee.name} className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-border-color flex items-center justify-center font-bold text-[9px] text-text-main">
                    {task.assignee.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="truncate max-w-[90px]">{task.assignee.name}</span>
              </>
            ) : (
              <span className="italic text-text-muted/60">Unassigned</span>
            )}
          </div>

          {/* Status flow buttons */}
          <div className="flex gap-1.5 shrink-0">
            {task.status !== 'todo' && (
              <button 
                onClick={() => handleStatusChange(tId, task.status === 'done' ? 'in-progress' : 'todo')}
                className="p-1 border border-border-color rounded hover:bg-border-color text-text-muted hover:text-text-main transition-all bg-transparent cursor-pointer"
                title="Move left"
              >
                <ArrowLeft size={12} />
              </button>
            )}
            {task.status !== 'done' && (
              <button 
                onClick={() => handleStatusChange(tId, task.status === 'todo' ? 'in-progress' : 'done')}
                className="p-1 border border-border-color rounded hover:bg-border-color text-text-muted hover:text-text-main transition-all bg-transparent cursor-pointer"
                title="Move right"
              >
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 px-2 sm:px-6 py-2 animate-fade-in-up">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight">Team Workspace</h1>
          <p className="text-text-muted text-sm">Convert action items into Kanban tasks and manage team execution.</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-linear-to-br from-[#3f3f46] to-[#18181b] dark:from-[#f4f4f5] dark:to-[#a1a1aa] text-white dark:text-zinc-950 rounded-2xl font-semibold text-[0.95rem] px-7 py-3 relative overflow-hidden transition-all duration-300 shadow-md min-h-[46px] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 before:content-[''] before:absolute before:top-0 before:left-[-150%] before:w-full before:h-full before:bg-[linear-gradient(90deg,transparent,var(--shimmer-color),transparent)] before:transition-all before:duration-700 hover:before:left-[150%] cursor-pointer"
        >
          <Plus size={16} />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="relative w-80 max-w-full">
        <Search className="absolute left-[0.95rem] top-1/2 -translate-y-1/2 text-text-muted" size={16} />
        <input 
          type="text" 
          placeholder="Filter workspace tasks..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-secondary-bg border border-border-color rounded-xl py-2.5 pr-4 pl-10 text-text-main text-sm outline-none transition-all focus:border-text-main"
        />
      </div>

      {/* Kanban Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-24 bg-secondary-bg border border-border-color rounded-3xl">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-text-main"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* TO DO Column */}
          <div className="bg-primary-bg/50 border border-border-color/80 rounded-3xl p-5 space-y-4 md:min-h-[500px] min-h-fit">
            <div className="flex items-center justify-between pb-2 border-b border-border-color/50">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-text-muted" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-text-main">To Do</h3>
              </div>
              <span className="text-xs font-bold bg-secondary-bg border border-border-color px-2.5 py-0.5 rounded-full text-text-muted">
                {todoTasks.length}
              </span>
            </div>
            <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
              {todoTasks.length === 0 ? (
                <p className="text-center py-8 text-xs text-text-muted/60 italic">No tasks in backlog</p>
              ) : (
                todoTasks.map(renderTaskCard)
              )}
            </div>
          </div>

          {/* IN PROGRESS Column */}
          <div className="bg-primary-bg/50 border border-border-color/80 rounded-3xl p-5 space-y-4 md:min-h-[500px] min-h-fit">
            <div className="flex items-center justify-between pb-2 border-b border-border-color/50">
              <div className="flex items-center gap-2">
                <Play size={16} className="text-blue-500" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-text-main">In Progress</h3>
              </div>
              <span className="text-xs font-bold bg-secondary-bg border border-border-color px-2.5 py-0.5 rounded-full text-text-muted">
                {inProgressTasks.length}
              </span>
            </div>
            <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
              {inProgressTasks.length === 0 ? (
                <p className="text-center py-8 text-xs text-text-muted/60 italic">No tasks in progress</p>
              ) : (
                inProgressTasks.map(renderTaskCard)
              )}
            </div>
          </div>

          {/* DONE Column */}
          <div className="bg-primary-bg/50 border border-border-color/80 rounded-3xl p-5 space-y-4 md:min-h-[500px] min-h-fit">
            <div className="flex items-center justify-between pb-2 border-b border-border-color/50">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-500" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-text-main">Done</h3>
              </div>
              <span className="text-xs font-bold bg-secondary-bg border border-border-color px-2.5 py-0.5 rounded-full text-text-muted">
                {doneTasks.length}
              </span>
            </div>
            <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
              {doneTasks.length === 0 ? (
                <p className="text-center py-8 text-xs text-text-muted/60 italic">No completed tasks</p>
              ) : (
                doneTasks.map(renderTaskCard)
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fade-in">
          <div className="bg-glass-bg border border-border-color rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border-color bg-secondary-bg flex justify-between items-center">
              <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                <Briefcase size={22} />
                Create Workspace Task
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-border-color rounded-full text-text-muted hover:text-text-main bg-transparent border-none cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              {/* Task Title */}
              <div className="m-0 mb-4">
                <label className="block text-xs font-bold text-text-muted mb-1.5 uppercase tracking-wider">Task Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Design WebRTC Screen Share"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full bg-input-bg border border-border-color rounded-xl px-4 py-2.5 text-text-main focus:outline-none focus:border-text-main"
                />
              </div>

              {/* Description */}
              <div className="m-0 mb-4">
                <label className="block text-xs font-bold text-text-muted mb-1.5 uppercase tracking-wider">Description</label>
                <textarea 
                  placeholder="Describe task scope, requirements, or dependencies..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                  className="w-full bg-input-bg border border-border-color rounded-xl px-4 py-2.5 text-text-main focus:outline-none focus:border-text-main resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Assignee select */}
                <div className="m-0">
                  <label className="block text-xs font-bold text-text-muted mb-1.5 uppercase tracking-wider">Assignee</label>
                  <div className="relative flex items-center w-full">
                    <select
                      value={newTask.assignee}
                      onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
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

                {/* Associated Meeting select */}
                <div className="m-0">
                  <label className="block text-xs font-bold text-text-muted mb-1.5 uppercase tracking-wider">Linked Meeting (Optional)</label>
                  <div className="relative flex items-center w-full">
                    <select
                      value={newTask.meetingId}
                      onChange={(e) => setNewTask({ ...newTask, meetingId: e.target.value })}
                      className="w-full bg-input-bg border border-border-color rounded-xl pl-3 pr-10 py-2.5 text-sm text-text-main focus:outline-none focus:border-text-main appearance-none cursor-pointer focus:ring-1 focus:ring-text-main transition-all"
                      style={{ minHeight: '42px' }}
                    >
                      <option value="" className="bg-secondary-bg text-text-main">None</option>
                      {meetings.map(m => (
                        <option key={m.id || m._id} value={m.id || m._id} className="bg-secondary-bg text-text-main">{m.title}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border-color">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="inline-flex items-center justify-center gap-2 bg-glass-bg border border-border-color text-text-main rounded-2xl font-semibold text-sm px-5 py-2.5 transition-all duration-200 hover:bg-border-color hover:border-text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center justify-center gap-2 bg-linear-to-br from-[#3f3f46] to-[#18181b] dark:from-[#f4f4f5] dark:to-[#a1a1aa] text-white dark:text-zinc-950 rounded-2xl font-semibold text-sm px-6 py-2.5 relative overflow-hidden transition-all duration-300 shadow-md hover:-translate-y-0.5"
                >
                  {formLoading ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workspace;
