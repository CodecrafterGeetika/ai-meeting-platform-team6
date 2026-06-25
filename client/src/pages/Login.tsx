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
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleDemoLogin = async () => {
    setError('');
    setIsLoading(true);

    // Retrieve or generate a unique demo email for this browser session
    let demoEmail = localStorage.getItem('persistedDemoEmail');
    if (!demoEmail) {
      const rand = Math.random().toString(36).substring(2, 10);
      demoEmail = `demo_${rand}@example.com`;
      localStorage.setItem('persistedDemoEmail', demoEmail);
    }
    const demoPassword = 'Password123!';

    try {
      await login({ email: demoEmail, password: demoPassword });
      navigate('/');
    } catch (err) {
      // If login fails (user does not exist yet), auto-register and try again
      try {
        await register({ name: 'Demo User', email: demoEmail, password: demoPassword });
        await login({ email: demoEmail, password: demoPassword });
        navigate('/');
      } catch (regErr) {
        // If registration fails, clear local storage and show error
        localStorage.removeItem('persistedDemoEmail');
        setError(regErr.response?.data?.message || 'Failed to initialize demo account.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="flex min-h-screen w-full bg-primary-bg">
      <ThemeToggle />
      <div className="hidden md:flex md:flex-col md:justify-center md:flex-[0_0_60%] p-12 bg-[radial-gradient(circle_at_0%_0%,var(--gradient-start)_0%,var(--gradient-end)_70%)] relative overflow-hidden">
        <div className="relative z-10 max-w-[600px]">
          <div className="flex items-center gap-3 text-2xl font-extrabold text-text-main mb-8 tracking-tight">
            <Video size={32} />
            <span>IntellMeet</span>
          </div>
          
          <h1 className="text-4xl lg:text-[2.5rem] font-extrabold leading-tight mb-4 text-text-main tracking-tighter">AI-Powered Enterprise Meeting & Collaboration Platform</h1>
          <p className="text-[1.05rem] text-text-muted mb-10 leading-relaxed">
            Real-time video meetings, AI summaries, smart action items, and team collaboration in one secure platform.
          </p>

          <div className="grid gap-3">
            <div className="flex items-center gap-4 bg-glass-bg border border-glass-border py-[0.85rem] px-5 rounded-2xl backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:translate-x-2 hover:bg-feature-hover">
              <div className="bg-border-color text-text-main p-2 rounded-xl flex items-center justify-center">
                <Video size={24} />
              </div>
              <span className="text-[0.95rem] font-semibold text-text-main">Real-Time Video Meetings</span>
            </div>
            <div className="flex items-center gap-4 bg-glass-bg border border-glass-border py-[0.85rem] px-5 rounded-2xl backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:translate-x-2 hover:bg-feature-hover">
              <div className="bg-border-color text-text-main p-2 rounded-xl flex items-center justify-center">
                <FileText size={24} />
              </div>
              <span className="text-[0.95rem] font-semibold text-text-main">AI Meeting Summaries</span>
            </div>
            <div className="flex items-center gap-4 bg-glass-bg border border-glass-border py-[0.85rem] px-5 rounded-2xl backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:translate-x-2 hover:bg-feature-hover">
              <div className="bg-border-color text-text-main p-2 rounded-xl flex items-center justify-center">
                <CheckSquare size={24} />
              </div>
              <span className="text-[0.95rem] font-semibold text-text-main">Smart Action Items</span>
            </div>
            <div className="flex items-center gap-4 bg-glass-bg border border-glass-border py-[0.85rem] px-5 rounded-2xl backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:translate-x-2 hover:bg-feature-hover">
              <div className="bg-border-color text-text-main p-2 rounded-xl flex items-center justify-center">
                <MessageSquare size={24} />
              </div>
              <span className="text-[0.95rem] font-semibold text-text-main">Team Chat & Collaboration</span>
            </div>
            <div className="flex items-center gap-4 bg-glass-bg border border-glass-border py-[0.85rem] px-5 rounded-2xl backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:translate-x-2 hover:bg-feature-hover">
              <div className="bg-border-color text-text-main p-2 rounded-xl flex items-center justify-center">
                <BarChart size={24} />
              </div>
              <span className="text-[0.95rem] font-semibold text-text-main">Meeting Analytics</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 md:flex-[0_0_40%] w-full flex items-center justify-center p-4 md:p-8 bg-primary-bg relative">
        <div className="bg-glass-bg backdrop-blur-[20px] border border-glass-border rounded-[28px] p-8 md:p-12 w-full max-w-[440px] shadow-card-shadow animate-slide-up">
          <h1 className="text-3xl font-bold mb-1 text-center tracking-tight text-text-main">Welcome Back</h1>
          <p className="text-text-muted text-sm text-center mb-8">Sign in to your account</p>
          
          {error && <div className="bg-red-500/8 text-error p-[0.85rem] rounded-[14px] text-sm mb-6 border border-red-500/15">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="email" className="block text-[0.85rem] font-semibold mb-2 text-text-muted uppercase tracking-wider">Email Address</label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full py-[0.85rem] pr-4 pl-12 bg-input-bg border border-border-color rounded-[14px] text-text-main text-[0.95rem] transition-all duration-200 outline-none focus:border-text-main focus:ring-2 focus:ring-border-color peer"
                />
                <Mail className="absolute left-[1.15rem] text-text-muted w-[1.15rem] h-[1.15rem] transition-colors duration-200 peer-focus:text-text-main" size={20} />
              </div>
            </div>
            
            <div className="mb-5">
              <label htmlFor="password" className="block text-[0.85rem] font-semibold mb-2 text-text-muted uppercase tracking-wider">Password</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full py-[0.85rem] pr-12 pl-12 bg-input-bg border border-border-color rounded-[14px] text-text-main text-[0.95rem] transition-all duration-200 outline-none focus:border-text-main focus:ring-2 focus:ring-border-color peer"
                />
                <Lock className="absolute left-[1.15rem] text-text-muted w-[1.15rem] h-[1.15rem] transition-colors duration-200 peer-focus:text-text-main" size={20} />
                <button 
                  type="button" 
                  className="absolute right-[1.15rem] bg-transparent border-none text-text-muted hover:text-text-main cursor-pointer flex items-center justify-center p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <button type="submit" className="w-full py-[0.85rem] bg-accent-color text-primary-bg border-none rounded-[14px] text-[0.95rem] font-semibold cursor-pointer transition-all duration-200 hover:bg-accent-hover hover:-translate-y-px" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-border-color"></div>
            <span className="px-3 text-xs text-text-muted font-semibold uppercase tracking-wider">or</span>
            <div className="flex-1 border-t border-border-color"></div>
          </div>

          <button 
            type="button" 
            onClick={handleDemoLogin}
            className="w-full py-[0.85rem] bg-glass-bg hover:bg-border-color text-text-main border border-border-color rounded-[14px] text-[0.95rem] font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-px flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            Sign In with Demo Account
          </button>
          
          <Link to="/register" className="block text-center mt-6 text-text-muted text-sm no-underline hover:text-text-main">
            Don't have an account? <span className="text-text-main font-semibold underline">Sign up</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;


