import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { Video } from 'lucide-react';

const Navbar = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { path: '/meetings', label: 'Meetings' },
    { path: '/profile', label: 'Profile' }
  ];

  return (
    <nav className="navbar relative z-50 flex justify-between items-center px-4 sm:px-8 py-4 bg-(--glass-bg) border-b border-(--border-color) backdrop-blur-md">
      <Link to="/" className="text-2xl font-bold text-(--text-main) no-underline flex items-center gap-2 hover:opacity-80 transition-opacity">
        <Video className="text-(--accent-color)" size={28} />
        IntellMeet
      </Link>
      
      <div className="flex gap-3 sm:gap-6 items-center">
        {navLinks.map((link) => (
          <Link 
            key={link.path} 
            to={link.path} 
            className={`font-medium transition-colors ${
              location.pathname.startsWith(link.path) 
                ? 'text-(--accent-color)' 
                : 'text-(--text-muted) hover:text-(--text-main)'
            }`}
          >
            {link.label}
          </Link>
        ))}
        
        <div className="h-6 w-px bg-(--border-color) mx-2 hidden sm:block"></div>
        
        <button 
          onClick={logout} 
          className="btn-logout text-sm font-semibold whitespace-nowrap"
        >
          Sign Out
        </button>
        
        <ThemeToggle inline={true} />
      </div>
    </nav>
  );
};

export default Navbar;


