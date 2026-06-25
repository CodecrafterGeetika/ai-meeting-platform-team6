import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  Video, 
  Plus, 
  User, 
  Settings, 
  Search, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  Sun,
  Moon,
  ChevronDown,
  DeleteIcon,
  Layers
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  // Real-time socket listener for notifications
  useEffect(() => {
    if (user) {
      const socketUrl = import.meta.env.VITE_API_URL 
        ? new URL(import.meta.env.VITE_API_URL).origin 
        : 'http://localhost:3000';
      const socket = io(socketUrl);
      
      socket.emit('register-user', user.id || user._id);

      socket.on('new-notification', (notif) => {
        setNotifications(prev => [notif, ...prev]);
        // Trigger a subtle sound notification if possible
        try {
          const context = new (window.AudioContext || window.webkitAudioContext)();
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.connect(gain);
          gain.connect(context.destination);
          osc.frequency.setValueAtTime(523.25, context.currentTime); // C5 note
          gain.gain.setValueAtTime(0.1, context.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.4);
          osc.start();
          osc.stop(context.currentTime + 0.4);
        } catch (e) {}
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/meetings', label: 'Meetings', icon: Video },
    { path: '/create', label: 'Create', icon: Plus },
    { path: '/workspace', label: 'Workspace', icon: Layers },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-read');
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    } catch (err) {
      console.error('Failed to mark notifications as read', err);
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id && n._id !== id));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const hasUnread = notifications.some(n => n.unread);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex min-h-screen w-full bg-primary-bg overflow-x-hidden">
      {/* Sidebar Overlay for Mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Nav */}
      <aside className={`w-[260px] bg-secondary-bg border-r border-border-color flex flex-col shrink-0 transition-transform duration-300 z-40 fixed lg:static top-0 bottom-0 left-0 h-full ${
        isMobileOpen ? 'translate-x-0' : 'translate-x-[-260px] lg:translate-x-0'
      }`}>
        <div className="p-8 px-7 flex items-center gap-3 text-[1.35rem] font-extrabold tracking-tight border-b border-border-color">
          <Video className="text-text-main" size={26} />
          <span>IntellMeet</span>
        </div>

        <nav className="p-6 px-4 flex flex-col gap-[0.35rem] grow">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-4 py-[0.85rem] px-[1.15rem] font-semibold text-[0.95rem] rounded-[14px] transition-all duration-250 ease-out border ${
                  isActive 
                    ? 'text-text-main bg-sidebar-active-bg border-sidebar-active-border shadow-[0_4px_12px_-5px_rgba(0,0,0,0.05)]' 
                    : 'text-text-muted border-transparent hover:text-text-main hover:bg-feature-hover'
                }`}
              >
                <Icon size={20} />
                <span>{link.label}</span>
              </Link>
            );
          })}
          
          <Link
            to="/settings"
            className={`flex items-center gap-4 py-[0.85rem] px-[1.15rem] font-semibold text-[0.95rem] rounded-[14px] transition-all duration-250 ease-out border ${
              location.pathname === '/settings' 
                ? 'text-text-main bg-sidebar-active-bg border-sidebar-active-border shadow-[0_4px_12px_-5px_rgba(0,0,0,0.05)]' 
                : 'text-text-muted border-transparent hover:text-text-main hover:bg-feature-hover'
            }`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="p-6 border-t border-border-color">
          <button 
            onClick={handleLogout} 
            className="flex items-center justify-start gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl cursor-pointer text-sm font-medium transition-all bg-transparent border-none"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden max-w-full">
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-border-color bg-secondary-bg z-30">
          <div className="flex items-center gap-4">
            {/* Mobile Toggle Button */}
            <button 
              className="lg:hidden p-2 text-text-main hover:bg-feature-hover rounded-xl"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
              {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <h2 className="text-xl font-bold hidden sm:block">
              {getGreeting()}, <span className="font-extrabold text-text-main">{user?.name || 'Alex'}!</span>
            </h2>
          </div>

          {/* Search bar */}
          <div className="relative w-80 max-w-full hidden md:block">
            <Search className="absolute left-[0.95rem] top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search meetings, recordings, transcriptions..." 
              className="w-full bg-primary-bg border border-border-color rounded-xl py-[0.65rem] pr-4 pl-10 text-text-main text-sm outline-none transition-all focus:border-text-main focus:ring-2 focus:ring-border-color"
            />
          </div>

          {/* Actions & Profile */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 text-text-main hover:bg-feature-hover rounded-xl transition-all"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2.5 text-text-main hover:bg-feature-hover rounded-xl relative flex items-center justify-center"
                aria-label="Notifications Center"
              >
                <Bell size={20} />
                {hasUnread && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-secondary-bg rounded-full"></span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute top-[52px] right-0 w-[320px] bg-secondary-bg border border-border-color rounded-2xl shadow-card-shadow p-4 flex flex-col gap-3 z-50 animate-slide-up">
                  <div className="flex justify-between items-center pb-2 border-b border-border-color">
                    <span className="font-bold text-sm text-text-main">Notifications</span>
                    {hasUnread && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-bold text-text-muted hover:text-text-main bg-transparent border-none cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  
                  <div className="overflow-y-auto max-h-64 space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-text-muted">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(notif => {
                        const notifId = notif._id || notif.id;
                        const notifTime = notif.createdAt 
                          ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                          : notif.time || 'now';
                        return (
                          <div 
                            key={notifId} 
                            className={`p-2.5 rounded-xl border transition-all text-left relative group ${
                              notif.unread 
                                ? 'bg-sidebar-active-bg border-sidebar-active-border' 
                                : 'bg-transparent border-transparent hover:bg-feature-hover'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-bold text-xs text-text-main line-clamp-1">{notif.title}</span>
                              <span className="text-[8px] text-text-muted shrink-0 mt-0.5">{notifTime}</span>
                            </div>
                            <p className="text-[11px] text-text-muted mt-1 leading-normal pr-4">{notif.message}</p>
                            <button
                              onClick={() => handleDeleteNotif(notifId)}
                              className="absolute right-2 bottom-2 p-0.5 rounded-full hover:bg-border-color text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer"
                              title="Delete notification"
                            >
                              <DeleteIcon size={10} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative cursor-pointer" ref={dropdownRef}>
              <div 
                className="flex items-center gap-2"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name} className="w-10 h-10 rounded-full object-cover border-2 border-border-color transition-colors hover:border-text-main" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-border-color flex items-center justify-center text-text-main font-bold border-2 border-border-color">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <ChevronDown size={16} className="text-text-muted" />
              </div>

              {isUserDropdownOpen && (
                <div className="absolute top-[52px] right-0 w-[220px] bg-secondary-bg border border-border-color rounded-2xl shadow-card-shadow p-3 flex flex-col gap-1 z-50 animate-slide-up">
                  <div className="px-3 py-2">
                    <p className="font-bold text-sm text-text-main truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-text-muted truncate">{user?.email || 'user@example.com'}</p>
                  </div>
                  <div className="h-px bg-border-color my-2"></div>
                  <Link to="/profile" className="flex items-center gap-3 py-[0.65rem] px-[0.85rem] text-sm text-text-muted hover:text-text-main hover:bg-feature-hover font-medium rounded-xl transition-all w-full text-left cursor-pointer bg-transparent border-none">
                    <User size={16} />
                    <span>My Profile</span>
                  </Link>
                  <Link to="/settings" className="flex items-center gap-3 py-[0.65rem] px-[0.85rem] text-sm text-text-muted hover:text-text-main hover:bg-feature-hover font-medium rounded-xl transition-all w-full text-left cursor-pointer bg-transparent border-none">
                    <Settings size={16} />
                    <span>Account Settings</span>
                  </Link>
                  <div className="h-px bg-border-color my-2"></div>
                  <button onClick={handleLogout} className="flex items-center gap-3 py-[0.65rem] px-[0.85rem] text-sm text-red-500 hover:bg-red-500/10 hover:text-red-500 font-medium rounded-xl transition-all w-full text-left cursor-pointer bg-transparent border-none">
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;


