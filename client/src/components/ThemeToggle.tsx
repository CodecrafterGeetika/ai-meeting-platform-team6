import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ inline = false }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`bg-glass-bg border border-glass-border rounded-full w-10 h-10 flex items-center justify-center cursor-pointer text-text-main backdrop-blur-md z-100 transition-all duration-300 ${
        inline ? 'relative top-auto right-auto' : 'absolute top-8 right-8'
      }`}
      aria-label="Toggle Theme"
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
};

export default ThemeToggle;


