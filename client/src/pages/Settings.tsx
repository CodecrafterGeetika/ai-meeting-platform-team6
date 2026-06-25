import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  Settings, 
  Volume2, 
  Video, 
  Mic, 
  Bell, 
  Lock, 
  Eye, 
  EyeOff,
  Check, 
  ShieldAlert,
  Sparkles,
  Smartphone,
  Info
} from 'lucide-react';

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  // Settings states
  const [visualEffects, setVisualEffects] = useState(true);
  const [selectedMic, setSelectedMic] = useState('default');
  const [selectedCam, setSelectedCam] = useState('default');
  const [selectedSpeaker, setSelectedSpeaker] = useState('default');
  
  // Notification states
  const [emailTranscripts, setEmailTranscripts] = useState(true);
  const [desktopBanners, setDesktopBanners] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [weeklySummaries, setWeeklySummaries] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState(5);

  // Password change states
  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirm: ''
  });
  const [showPass, setShowPass] = useState(false);

  // Status message state
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [testPlaying, setTestPlaying] = useState(false);

  const handleTestSpeaker = () => {
    setTestPlaying(true);
    // Simulate playing a chime
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.2);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1.2);

    setTimeout(() => {
      setTestPlaying(false);
    }, 1200);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setIsError(false);
    
    if (passwords.newPass || passwords.confirm || passwords.current) {
      if (!passwords.current) {
        setIsError(true);
        setMessage('Current password is required to change password.');
        return;
      }
      if (passwords.newPass !== passwords.confirm) {
        setIsError(true);
        setMessage('New passwords do not match.');
        return;
      }
      if (passwords.newPass.length < 6) {
        setIsError(true);
        setMessage('New password must be at least 6 characters.');
        return;
      }
    }

    setMessage('Settings updated successfully!');
    setPasswords({ current: '', newPass: '', confirm: '' });
    
    setTimeout(() => {
      setMessage('');
    }, 4000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight">System Settings</h1>
        <p className="text-text-muted text-sm">Configure hardware inputs, custom notification criteria, and security.</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Status Alert Banner */}
        {message && (
          <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-2 ${
            isError 
              ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' 
              : 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
          }`}>
            {!isError ? <Check size={18} /> : <ShieldAlert size={18} />}
            <span>{message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1 & 2: Main Panels */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Panel 1: Device Configuration */}
            <div className="bg-secondary-bg border border-border-color rounded-3xl p-8 shadow-card-shadow space-y-5">
              <h3 className="text-lg font-bold text-text-main border-b border-border-color pb-3 flex items-center gap-2">
                <Mic size={18} />
                <span>Audio & Video Hardware</span>
              </h3>

              <div className="space-y-4">
                {/* Camera select */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-text-muted mb-1.5 uppercase tracking-wider">Video Camera Device</label>
                  <div className="relative flex items-center">
                    <select
                      value={selectedCam}
                      onChange={(e) => setSelectedCam(e.target.value)}
                      className="w-full bg-input-bg border border-border-color rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-text-main appearance-none cursor-pointer peer focus:ring-1 focus:ring-text-main transition-all"
                      style={{ minHeight: '46px' }}
                    >
                      <option value="default">Default FaceTime Camera / Webcam</option>
                      <option value="cam-hd">Logitech StreamCam HD (USB-C)</option>
                      <option value="cam-virtual">OBS Virtual Camera Source</option>
                    </select>
                    <Video className="absolute left-[1.15rem] text-text-muted w-[1.15rem] h-[1.15rem] transition-colors duration-200 peer-focus:text-text-main pointer-events-none" size={16} />
                  </div>
                </div>

                {/* Mic select */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-text-muted mb-1.5 uppercase tracking-wider">Microphone Input Device</label>
                  <div className="relative flex items-center">
                    <select
                      value={selectedMic}
                      onChange={(e) => setSelectedMic(e.target.value)}
                      className="w-full bg-input-bg border border-border-color rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-text-main appearance-none cursor-pointer peer focus:ring-1 focus:ring-text-main transition-all"
                      style={{ minHeight: '46px' }}
                    >
                      <option value="default">Default System Audio Microphone</option>
                      <option value="mic-yeti">Yeti Stereo Microphone (USB)</option>
                      <option value="mic-pods">AirPods Pro Wireless Mic</option>
                    </select>
                    <Mic className="absolute left-[1.15rem] text-text-muted w-[1.15rem] h-[1.15rem] transition-colors duration-200 peer-focus:text-text-main pointer-events-none" size={16} />
                  </div>
                </div>

                {/* Speaker select */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-text-muted mb-1.5 uppercase tracking-wider">Speaker Output Device</label>
                  <div className="flex gap-3 items-stretch">
                    <div className="relative flex items-center flex-1">
                      <select
                        value={selectedSpeaker}
                        onChange={(e) => setSelectedSpeaker(e.target.value)}
                        className="w-full bg-input-bg border border-border-color rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-text-main appearance-none cursor-pointer peer focus:ring-1 focus:ring-text-main transition-all"
                        style={{ minHeight: '46px' }}
                      >
                        <option value="default">Default Built-in Speakers</option>
                        <option value="speakers-line">External Speakers (Line Out)</option>
                        <option value="speakers-pods">AirPods Pro Stereo Output</option>
                      </select>
                      <Volume2 className="absolute left-[1.15rem] text-text-muted w-[1.15rem] h-[1.15rem] transition-colors duration-200 peer-focus:text-text-main pointer-events-none" size={16} />
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleTestSpeaker}
                      disabled={testPlaying}
                      className="inline-flex items-center justify-center gap-2 bg-glass-bg border border-border-color text-text-main rounded-2xl font-semibold text-[0.95rem] px-4 py-3 transition-all duration-200 min-h-[46px] hover:bg-border-color hover:border-text-muted shrink-0"
                      style={{ minHeight: '46px' }}
                    >
                      {testPlaying ? 'Chiming...' : 'Test Sound'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 2: Account Security */}
            <div className="bg-secondary-bg border border-border-color rounded-3xl p-8 shadow-card-shadow space-y-5">
              <h3 className="text-lg font-bold text-text-main border-b border-border-color pb-3 flex items-center gap-2">
                <Lock size={18} />
                <span>Security Settings</span>
              </h3>

              <div className="space-y-4">
                {/* Current password */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-text-muted mb-1.5 uppercase tracking-wider">Current Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      className="w-full bg-input-bg border border-border-color rounded-xl pl-10 pr-12 py-2.5 text-sm text-text-main focus:outline-none focus:border-text-main transition-all peer focus:ring-1 focus:ring-text-main"
                    />
                    <Lock className="absolute left-[1.15rem] text-text-muted w-[1.15rem] h-[1.15rem] transition-colors duration-200 peer-focus:text-text-main pointer-events-none" size={16} />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-[1.15rem] bg-transparent border-none text-text-muted hover:text-text-main cursor-pointer flex items-center justify-center p-1"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* New password */}
                  <div className="mb-5">
                    <label className="block text-xs font-bold text-text-muted mb-1.5 uppercase tracking-wider">New Password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showPass ? 'text' : 'password'}
                        placeholder="Min 6 characters"
                        value={passwords.newPass}
                        onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                        className="w-full bg-input-bg border border-border-color rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-text-main transition-all peer focus:ring-1 focus:ring-text-main"
                      />
                      <Lock className="absolute left-[1.15rem] text-text-muted w-[1.15rem] h-[1.15rem] transition-colors duration-200 peer-focus:text-text-main pointer-events-none" size={16} />
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div className="mb-5">
                    <label className="block text-xs font-bold text-text-muted mb-1.5 uppercase tracking-wider">Confirm New Password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showPass ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className="w-full bg-input-bg border border-border-color rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-text-main transition-all peer focus:ring-1 focus:ring-text-main"
                      />
                      <Lock className="absolute left-[1.15rem] text-text-muted w-[1.15rem] h-[1.15rem] transition-colors duration-200 peer-focus:text-text-main pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Column 3: Sidebar Panels */}
          <div className="space-y-6">
            
            {/* Panel 3: Quick Preferences */}
            <div className="bg-secondary-bg border border-border-color rounded-3xl p-8 shadow-card-shadow space-y-6">
              <h3 className="text-lg font-bold text-text-main border-b border-border-color pb-3">
                Interface Customization
              </h3>

              <div className="space-y-6">
                {/* Theme toggle switch */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-text-main">Dark Appearance</h4>
                    <p className="text-xs text-text-muted">Toggle metallic color filters</p>
                  </div>
                  <div className="relative inline-block w-12 h-[26px] shrink-0">
                    <input 
                      type="checkbox" 
                      checked={theme === 'dark'}
                      onChange={toggleTheme}
                      className="sr-only peer"
                      id="theme-dark-toggle"
                    />
                    <label 
                      htmlFor="theme-dark-toggle"
                      className="absolute cursor-pointer inset-0 bg-border-color border border-border-color rounded-full transition-colors duration-300 peer-checked:bg-toggle-on-bg peer-checked:border-toggle-on-bg after:content-[''] after:absolute after:h-[18px] after:w-[18px] after:left-[3px] after:bottom-[3px] after:bg-toggle-thumb after:rounded-full after:shadow-md after:transition-transform after:duration-300 peer-checked:after:translate-x-[22px]"
                    />
                  </div>
                </div>

                {/* Visual effects toggle switch */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-text-main">Aesthetic Effects</h4>
                    <p className="text-xs text-text-muted">Smooth page transitions & animations</p>
                  </div>
                  <div className="relative inline-block w-12 h-[26px] shrink-0">
                    <input 
                      type="checkbox" 
                      checked={visualEffects}
                      onChange={(e) => setVisualEffects(e.target.checked)}
                      className="sr-only peer"
                      id="visual-effects-toggle"
                    />
                    <label 
                      htmlFor="visual-effects-toggle"
                      className="absolute cursor-pointer inset-0 bg-border-color border border-border-color rounded-full transition-colors duration-300 peer-checked:bg-toggle-on-bg peer-checked:border-toggle-on-bg after:content-[''] after:absolute after:h-[18px] after:w-[18px] after:left-[3px] after:bottom-[3px] after:bg-toggle-thumb after:rounded-full after:shadow-md after:transition-transform after:duration-300 peer-checked:after:translate-x-[22px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 4: Notification Toggles */}
            <div className="bg-secondary-bg border border-border-color rounded-3xl p-8 shadow-card-shadow space-y-6">
              <h3 className="text-lg font-bold text-text-main border-b border-border-color pb-3 flex items-center gap-2">
                <Bell size={18} />
                <span>Alert Rules</span>
              </h3>

              <div className="space-y-5">
                {/* Email summaries */}
                <div className="flex items-center justify-between">
                  <div className="pr-4">
                    <h4 className="text-sm font-bold text-text-main">AI Transcripts via Email</h4>
                    <p className="text-xs text-text-muted">Get summaries automatically</p>
                  </div>
                  <div className="relative inline-block w-12 h-[26px] shrink-0">
                    <input 
                      type="checkbox" 
                      checked={emailTranscripts}
                      onChange={(e) => setEmailTranscripts(e.target.checked)}
                      className="sr-only peer"
                      id="email-transcripts-toggle"
                    />
                    <label 
                      htmlFor="email-transcripts-toggle"
                      className="absolute cursor-pointer inset-0 bg-border-color border border-border-color rounded-full transition-colors duration-300 peer-checked:bg-toggle-on-bg peer-checked:border-toggle-on-bg after:content-[''] after:absolute after:h-[18px] after:w-[18px] after:left-[3px] after:bottom-[3px] after:bg-toggle-thumb after:rounded-full after:shadow-md after:transition-transform after:duration-300 peer-checked:after:translate-x-[22px]"
                    />
                  </div>
                </div>

                {/* Desktop banners */}
                <div className="flex items-center justify-between">
                  <div className="pr-4">
                    <h4 className="text-sm font-bold text-text-main">Push Notifications</h4>
                    <p className="text-xs text-text-muted">Real-time room alerts & mentions</p>
                  </div>
                  <div className="relative inline-block w-12 h-[26px] shrink-0">
                    <input 
                      type="checkbox" 
                      checked={desktopBanners}
                      onChange={(e) => setDesktopBanners(e.target.checked)}
                      className="sr-only peer"
                      id="desktop-banners-toggle"
                    />
                    <label 
                      htmlFor="desktop-banners-toggle"
                      className="absolute cursor-pointer inset-0 bg-border-color border border-border-color rounded-full transition-colors duration-300 peer-checked:bg-toggle-on-bg peer-checked:border-toggle-on-bg after:content-[''] after:absolute after:h-[18px] after:w-[18px] after:left-[3px] after:bottom-[3px] after:bg-toggle-thumb after:rounded-full after:shadow-md after:transition-transform after:duration-300 peer-checked:after:translate-x-[22px]"
                    />
                  </div>
                </div>

                {/* Sound alerts */}
                <div className="flex items-center justify-between">
                  <div className="pr-4">
                    <h4 className="text-sm font-bold text-text-main">Sound Effects</h4>
                    <p className="text-xs text-text-muted">Chime on user entry/exit</p>
                  </div>
                  <div className="relative inline-block w-12 h-[26px] shrink-0">
                    <input 
                      type="checkbox" 
                      checked={soundEffects}
                      onChange={(e) => setSoundEffects(e.target.checked)}
                      className="sr-only peer"
                      id="sound-effects-toggle"
                    />
                    <label 
                      htmlFor="sound-effects-toggle"
                      className="absolute cursor-pointer inset-0 bg-border-color border border-border-color rounded-full transition-colors duration-300 peer-checked:bg-toggle-on-bg peer-checked:border-toggle-on-bg after:content-[''] after:absolute after:h-[18px] after:w-[18px] after:left-[3px] after:bottom-[3px] after:bg-toggle-thumb after:rounded-full after:shadow-md after:transition-transform after:duration-300 peer-checked:after:translate-x-[22px]"
                    />
                  </div>
                </div>

                {/* Weekly summaries */}
                <div className="flex items-center justify-between">
                  <div className="pr-4">
                    <h4 className="text-sm font-bold text-text-main">Weekly AI Recap</h4>
                    <p className="text-xs text-text-muted">Digest of tasks & productivity metrics</p>
                  </div>
                  <div className="relative inline-block w-12 h-[26px] shrink-0">
                    <input 
                      type="checkbox" 
                      checked={weeklySummaries}
                      onChange={(e) => setWeeklySummaries(e.target.checked)}
                      className="sr-only peer"
                      id="weekly-summaries-toggle"
                    />
                    <label 
                      htmlFor="weekly-summaries-toggle"
                      className="absolute cursor-pointer inset-0 bg-border-color border border-border-color rounded-full transition-colors duration-300 peer-checked:bg-toggle-on-bg peer-checked:border-toggle-on-bg after:content-[''] after:absolute after:h-[18px] after:w-[18px] after:left-[3px] after:bottom-[3px] after:bg-toggle-thumb after:rounded-full after:shadow-md after:transition-transform after:duration-300 peer-checked:after:translate-x-[22px]"
                    />
                  </div>
                </div>

                {/* Reminder timings */}
                <div className="m-0 border-t border-border-color pt-3">
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Alert Timing Before Meetings</label>
                  <select
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(Number(e.target.value))}
                    className="w-full bg-input-bg border border-border-color rounded-xl px-3 py-2 text-xs text-text-main focus:outline-none focus:border-text-main appearance-none cursor-pointer"
                    style={{ minHeight: '38px' }}
                  >
                    <option value={0}>On scheduled time</option>
                    <option value={2}>2 minutes before</option>
                    <option value={5}>5 minutes before</option>
                    <option value={10}>10 minutes before</option>
                    <option value={15}>15 minutes before</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Actions save button */}
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-linear-to-br from-[#3f3f46] to-[#18181b] dark:from-[#f4f4f5] dark:to-[#a1a1aa] text-white dark:text-zinc-950 rounded-2xl font-semibold text-[0.95rem] px-7 py-3 relative overflow-hidden transition-all duration-300 shadow-md min-h-[46px] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 before:content-[''] before:absolute before:top-0 before:left-[-150%] before:w-full before:h-full before:bg-[linear-gradient(90deg,transparent,var(--shimmer-color),transparent)] before:transition-all before:duration-700 hover:before:left-[150%] cursor-pointer"
              style={{ minHeight: '46px' }}
            >
              <span>Save System Settings</span>
              <Sparkles size={16} />
            </button>

          </div>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;


