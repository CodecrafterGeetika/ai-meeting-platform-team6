import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, KeyRound, Video, FileText, CheckSquare, MessageSquare, BarChart } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const { register, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (step === 1) {
        const response = await register({ name, email, password });
        setUserId(response.userId);
        setStep(2);
      } else {
        await verifyOTP(userId, otp);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process request. Please try again.');
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
          <h1>{step === 1 ? 'Create Account' : 'Verify Email'}</h1>
          <p className="subtitle">{step === 1 ? 'Join us to get started' : 'We sent a code to your email'}</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <div className="input-icon-wrapper">
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                    <User className="input-icon" size={20} />
                  </div>
                </div>

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
                      placeholder="Min 8 chars, 1 letter, 1 number"
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
              </>
            ) : (
              <div className="form-group">
                <label htmlFor="otp">Verification Code</label>
                <div className="input-icon-wrapper">
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    required
                  />
                  <KeyRound className="input-icon" size={20} />
                </div>
                <p className="hint-text" style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem'}}>Enter the 6-digit code sent to your email.</p>
              </div>
            )}
            
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Processing...' : (step === 1 ? 'Sign Up' : 'Verify & Login')}
            </button>
          </form>
          
          {step === 1 ? (
            <Link to="/login" className="auth-link">
              Already have an account? <span>Sign in</span>
            </Link>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button 
                type="button" 
                onClick={() => { setStep(1); setOtp(''); }} 
                className="auth-link"
                style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
              >
                Need to change your email? <span>Go Back</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
