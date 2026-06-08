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
        <h1 className="text-3xl font-extrabold text-(--text-main) tracking-tight">System Settings</h1>
        <p className="text-(--text-muted) text-sm">Configure hardware inputs, custom notification criteria, and security.</p>
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
            <div className="premium-card space-y-5">
              <h3 className="text-lg font-bold text-(--text-main) border-b border-(--border-color) pb-3 flex items-center gap-2">
                <Mic size={18} />
                <span>Audio & Video Hardware</span>
              </h3>

              <div className="space-y-4">
                {/* Camera select */}
                <div className="form-group m-0">
                  <label className="block text-xs font-bold text-(--text-muted) mb-1.5 uppercase tracking-wider">Video Camera Device</label>
                  <div className="input-icon-wrapper">
                    <select
                      value={selectedCam}
                      onChange={(e) => setSelectedCam(e.target.value)}
                      className="w-full bg-(--input-bg) border border-(--border-color) rounded-xl pl-10 pr-4 py-2.5 text-sm text-(--text-main) focus:outline-none focus:border-(--text-main) appearance-none cursor-pointer"
                      style={{ minHeight: '46px' }}
                    >
                      <option value="default">Default FaceTime Camera / Webcam</option>
                      <option value="cam-hd">Logitech StreamCam HD (USB-C)</option>
                      <option value="cam-virtual">OBS Virtual Camera Source</option>
                    </select>
                    <Video className="input-icon" size={16} />
                  </div>
                </div>

                {/* Mic select */}
                <div className="form-group m-0">
                  <label className="block text-xs font-bold text-(--text-muted) mb-1.5 uppercase tracking-wider">Microphone Input Device</label>
                  <div className="input-icon-wrapper">
                    <select
                      value={selectedMic}
                      onChange={(e) => setSelectedMic(e.target.value)}
                      className="w-full bg-(--input-bg) border border-(--border-color) rounded-xl pl-10 pr-4 py-2.5 text-sm text-(--text-main) focus:outline-none focus:border-(--text-main) appearance-none cursor-pointer"
                      style={{ minHeight: '46px' }}
                    >
                      <option value="default">Default System Audio Microphone</option>
                      <option value="mic-yeti">Yeti Stereo Microphone (USB)</option>
                      <option value="mic-pods">AirPods Pro Wireless Mic</option>
                    </select>
                    <Mic className="input-icon" size={16} />
                  </div>
                </div>

                {/* Speaker select */}
                <div className="form-group m-0">
                  <label className="block text-xs font-bold text-(--text-muted) mb-1.5 uppercase tracking-wider">Speaker Output Device</label>
                  <div className="flex gap-3 items-stretch">
                    <div className="input-icon-wrapper flex-1">
                      <select
                        value={selectedSpeaker}
                        onChange={(e) => setSelectedSpeaker(e.target.value)}
                        className="w-full bg-(--input-bg) border border-(--border-color) rounded-xl pl-10 pr-4 py-2.5 text-sm text-(--text-main) focus:outline-none focus:border-(--text-main) appearance-none cursor-pointer"
                        style={{ minHeight: '46px' }}
                      >
                        <option value="default">Default Built-in Speakers</option>
                        <option value="speakers-line">External Speakers (Line Out)</option>
                        <option value="speakers-pods">AirPods Pro Stereo Output</option>
                      </select>
                      <Volume2 className="input-icon" size={16} />
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleTestSpeaker}
                      disabled={testPlaying}
                      className="btn-glass px-4 flex items-center justify-center shrink-0"
                      style={{ minHeight: '46px' }}
                    >
                      {testPlaying ? 'Chiming...' : 'Test Sound'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 2: Account Security */}
            <div className="premium-card space-y-5">
              <h3 className="text-lg font-bold text-(--text-main) border-b border-(--border-color) pb-3 flex items-center gap-2">
                <Lock size={18} />
                <span>Security Settings</span>
              </h3>

              <div className="space-y-4">
                {/* Current password */}
                <div className="form-group m-0">
                  <label className="block text-xs font-bold text-(--text-muted) mb-1.5 uppercase tracking-wider">Current Password</label>
                  <div className="input-icon-wrapper">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      className="w-full bg-(--input-bg) border border-(--border-color) rounded-xl pl-10 pr-12 py-2.5 text-sm text-(--text-main) focus:outline-none focus:border-(--text-main) transition-all"
                    />
                    <Lock className="input-icon" size={16} />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="password-toggle"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* New password */}
                  <div className="form-group m-0">
                    <label className="block text-xs font-bold text-(--text-muted) mb-1.5 uppercase tracking-wider">New Password</label>
                    <div className="input-icon-wrapper">
                      <input
                        type={showPass ? 'text' : 'password'}
                        placeholder="Min 6 characters"
                        value={passwords.newPass}
                        onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                        className="w-full bg-(--input-bg) border border-(--border-color) rounded-xl pl-10 pr-4 py-2.5 text-sm text-(--text-main) focus:outline-none focus:border-(--text-main) transition-all"
                      />
                      <Lock className="input-icon" size={16} />
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div className="form-group m-0">
                    <label className="block text-xs font-bold text-(--text-muted) mb-1.5 uppercase tracking-wider">Confirm New Password</label>
                    <div className="input-icon-wrapper">
                      <input
                        type={showPass ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className="w-full bg-(--input-bg) border border-(--border-color) rounded-xl pl-10 pr-4 py-2.5 text-sm text-(--text-main) focus:outline-none focus:border-(--text-main) transition-all"
                      />
                      <Lock className="input-icon" size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Column 3: Sidebar Panels */}
          <div className="space-y-6">
            
            {/* Panel 3: Quick Preferences */}
            <div className="premium-card space-y-6">
              <h3 className="text-lg font-bold text-(--text-main) border-b border-(--border-color) pb-3">
                Interface Customization
              </h3>

              <div className="space-y-6">
                {/* Theme toggle switch */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-(--text-main)">Dark Appearance</h4>
                    <p className="text-xs text-(--text-muted)">Toggle metallic color filters</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={theme === 'dark'}
                      onChange={toggleTheme}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {/* Visual effects toggle switch */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-(--text-main)">Aesthetic Effects</h4>
                    <p className="text-xs text-(--text-muted)">Smooth page transitions & animations</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={visualEffects}
                      onChange={(e) => setVisualEffects(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Panel 4: Notification Toggles */}
            <div className="premium-card space-y-6">
              <h3 className="text-lg font-bold text-(--text-main) border-b border-(--border-color) pb-3 flex items-center gap-2">
                <Bell size={18} />
                <span>Alert Rules</span>
              </h3>

              <div className="space-y-5">
                {/* Email summaries */}
                <div className="flex items-center justify-between">
                  <div className="pr-4">
                    <h4 className="text-sm font-bold text-(--text-main)">AI Transcripts via Email</h4>
                    <p className="text-xs text-(--text-muted)">Get summaries automatically</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={emailTranscripts}
                      onChange={(e) => setEmailTranscripts(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {/* Desktop banners */}
                <div className="flex items-center justify-between">
                  <div className="pr-4">
                    <h4 className="text-sm font-bold text-(--text-main)">Push Notifications</h4>
                    <p className="text-xs text-(--text-muted)">Real-time room alerts & mentions</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={desktopBanners}
                      onChange={(e) => setDesktopBanners(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {/* Sound alerts */}
                <div className="flex items-center justify-between">
                  <div className="pr-4">
                    <h4 className="text-sm font-bold text-(--text-main)">Sound Effects</h4>
                    <p className="text-xs text-(--text-muted)">Chime on user entry/exit</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={soundEffects}
                      onChange={(e) => setSoundEffects(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {/* Weekly summaries */}
                <div className="flex items-center justify-between">
                  <div className="pr-4">
                    <h4 className="text-sm font-bold text-(--text-main)">Weekly AI Recap</h4>
                    <p className="text-xs text-(--text-muted)">Digest of tasks & productivity metrics</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={weeklySummaries}
                      onChange={(e) => setWeeklySummaries(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {/* Reminder timings */}
                <div className="form-group border-t border-(--border-color) pt-3 m-0">
                  <label className="block text-xs font-semibold text-(--text-muted) mb-1.5 uppercase tracking-wider">Alert Timing Before Meetings</label>
                  <select
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(Number(e.target.value))}
                    className="w-full bg-(--input-bg) border border-(--border-color) rounded-xl px-3 py-2 text-xs text-(--text-main) focus:outline-none focus:border-(--text-main) appearance-none cursor-pointer"
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
              className="btn-metallic w-full py-3 flex items-center justify-center gap-2"
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


