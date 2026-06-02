import React from 'react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user, logout } = useAuth();

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="nav-brand">AI Meeting Platform</div>
        <button onClick={logout} className="btn-logout">
          Sign Out
        </button>
      </nav>

      <div className="dashboard-card">
        <h2>Welcome back, {user?.name}!</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Your email is verified and you are logged in as {user?.role}.
        </p>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          This is the starting point for your AI Meeting Platform dashboard. We will implement video calling, scheduling, and AI transcription in the upcoming days!
        </p>
      </div>
    </div>
  );
};

export default Home;
