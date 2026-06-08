import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
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
  ChevronDown
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Notifications state & center setup
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'AI Summary Completed',
      message: 'Transcription and meeting recap for "Product Sync" is ready.',
      time: '10m ago',
      unread: true
    },
    {
      id: 2,
      title: 'Upcoming Sync Meeting',
      message: 'Meeting "AI Roadmap Discussion" starts in 5 minutes.',
      time: '30m ago',
      unread: true
    },
    {
      id: 3,
      title: 'Profile Saved',
      message: 'Your personal settings were updated successfully.',
      time: '1h ago',
      unread: false
    }
  ]);
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

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/meetings', label: 'Meetings', icon: Video },
    { path: '/create', label: 'Create', icon: Plus },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleDeleteNotif = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const hasUnread = notifications.some(n => n.unread);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="app-layout-wrapper">
      {/* Sidebar Overlay for Mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Nav */}
      <aside className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''} fixed lg:static top-0 bottom-0 left-0 h-full w-[260px]`}>
        <div className="sidebar-logo">
          <Video className="text-(--text-main)" size={26} />
          <span>IntellMeet</span>
        </div>

        <nav className="sidebar-nav-list">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{link.label}</span>
              </Link>
            );
          })}
          
          <Link
            to="/settings"
            className={`sidebar-nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={handleLogout} 
            className="dropdown-item flex items-center justify-start gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-500/10 hover:text-red-500 rounded-xl"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="app-main-view">
        {/* Top Header */}
        <header className="app-top-header">
          <div className="flex items-center gap-4">
            {/* Mobile Toggle Button */}
            <button 
              className="lg:hidden p-2 text-(--text-main) hover:bg-(--feature-hover) rounded-xl"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
              {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <h2 className="text-xl font-bold hidden sm:block">
              {getGreeting()}, <span className="font-extrabold text-(--text-main)">{user?.name || 'Alex'}!</span>
            </h2>
          </div>

          {/* Search bar */}
          <div className="header-search-container hidden md:block">
            <Search size={18} />
            <input type="text" placeholder="Search meetings, recordings, transcriptions..." />
          </div>

          {/* Actions & Profile */}
          <div className="header-user-menu">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 text-(--text-main) hover:bg-(--feature-hover) rounded-xl transition-all"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2.5 text-(--text-main) hover:bg-(--feature-hover) rounded-xl relative flex items-center justify-center"
                aria-label="Notifications Center"
              >
                <Bell size={20} />
                {hasUnread && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-(--secondary-bg) rounded-full"></span>
                )}
              </button>

              {isNotifOpen && (
                <div 
                  className="user-dropdown-card" 
                  style={{ width: '320px', top: '52px', right: 0, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                >
                  <div className="flex justify-between items-center pb-2 border-b border-(--border-color)">
                    <span className="font-bold text-sm text-(--text-main)">Notifications</span>
                    {hasUnread && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-bold text-(--text-muted) hover:text-(--text-main) bg-transparent border-none cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  
                  <div className="overflow-y-auto max-h-64 space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-(--text-muted)">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`p-2.5 rounded-xl border transition-all text-left relative group ${
                            notif.unread 
                              ? 'bg-(--sidebar-active-bg) border-(--sidebar-active-border)' 
                              : 'bg-transparent border-transparent hover:bg-(--feature-hover)'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-xs text-(--text-main) line-clamp-1">{notif.title}</span>
                            <span className="text-[8px] text-(--text-muted) shrink-0 mt-0.5">{notif.time}</span>
                          </div>
                          <p className="text-[11px] text-(--text-muted) mt-1 leading-normal pr-4">{notif.message}</p>
                          <button
                            onClick={() => handleDeleteNotif(notif.id)}
                            className="absolute right-2 bottom-2 p-0.5 rounded-full hover:bg-(--border-color) text-(--text-muted) hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer"
                            title="Delete notification"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="avatar-wrapper" ref={dropdownRef}>
              <div 
                className="flex items-center gap-2"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name} className="avatar-image" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-(--border-color) flex items-center justify-center text-(--text-main) font-bold border-2 border-(--border-color)">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <ChevronDown size={16} className="text-(--text-muted)" />
              </div>

              {isUserDropdownOpen && (
                <div className="user-dropdown-card">
                  <div className="px-3 py-2">
                    <p className="font-bold text-sm text-(--text-main) truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-(--text-muted) truncate">{user?.email || 'user@example.com'}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/profile" className="dropdown-item">
                    <User size={16} />
                    <span>My Profile</span>
                  </Link>
                  <Link to="/settings" className="dropdown-item">
                    <Settings size={16} />
                    <span>Account Settings</span>
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item text-red-500 hover:text-red-500">
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="app-scroll-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;


