import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Meetings from './pages/Meetings';
import CreateMeeting from './pages/CreateMeeting';
import MeetingRoom from './pages/MeetingRoom';
import { Video } from 'lucide-react';
import './index.css';

// A premium loading component for auth initialization
const AuthWrapper = ({ children }) => {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-(--primary-bg) flex flex-col justify-center items-center text-(--text-main)">
        <Video className="text-(--accent-color) animate-bounce mb-6" size={64} />
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-(--accent-color) rounded-full animate-ping" style={{ animationDuration: '1s' }}></div>
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-ping" style={{ animationDuration: '1s', animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-ping" style={{ animationDuration: '1s', animationDelay: '0.4s' }}></div>
        </div>
        <h2 className="mt-6 text-xl font-medium text-(--text-muted) animate-pulse">Initializing IntellMeet...</h2>
      </div>
    );
  }
  return children;
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AuthWrapper>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/meetings" element={<Meetings />} />
                  <Route path="/create" element={<CreateMeeting />} />
                </Route>
                <Route path="/meeting-room/:id" element={<MeetingRoom />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthWrapper>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;


