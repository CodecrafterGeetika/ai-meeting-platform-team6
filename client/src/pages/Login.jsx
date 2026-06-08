import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Video, FileText, CheckSquare, MessageSquare, BarChart } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <ThemeToggle />
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">
            <Video size={32} />
            <span>IntellMeet</span>
          </div>
          
          <h1 className="auth-title">AI-Powered Enterprise Meeting & Collaboration Platform</h1>
          <p className="auth-description">
            Real-time video meetings, AI summaries, smart action items, and team collaboration in one secure platform.
          </p>

          <div className="auth-features">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Video size={24} />
              </div>
              <span className="feature-text">Real-Time Video Meetings</span>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <FileText size={24} />
              </div>
              <span className="feature-text">AI Meeting Summaries</span>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <CheckSquare size={24} />
              </div>
              <span className="feature-text">Smart Action Items</span>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <MessageSquare size={24} />
              </div>
              <span className="feature-text">Team Chat & Collaboration</span>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <BarChart size={24} />
              </div>
              <span className="feature-text">Meeting Analytics</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h1>Welcome Back</h1>
          <p className="subtitle">Sign in to your account</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-icon-wrapper">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
                <Mail className="input-icon" size={20} />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-icon-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <Lock className="input-icon" size={20} />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <Link to="/register" className="auth-link">
            Don't have an account? <span>Sign up</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;


