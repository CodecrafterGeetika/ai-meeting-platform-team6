import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Briefcase, 
  Sparkles,
  Camera,
  Check
} from 'lucide-react';

const Profile = () => {
  const { user, setUser } = useAuth() as any;
  const [profile, setProfile] = useState({
    fullName: '',
    company: '',
    designation: '',
    location: '',
    bio: '',
    skills: '',
    avatar: ''
  });
  
  // Custom states for mocking preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [realtimeTranscription, setRealtimeTranscription] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile/me');
      if (response.data) {
        setProfile({
          fullName: response.data.fullName || user?.name || '',
          company: response.data.company || '',
          designation: response.data.designation || '',
          location: response.data.location || '',
          bio: response.data.bio || '',
          skills: response.data.skills?.join(', ') || '',
          avatar: response.data.avatar || user?.avatar || ''
        });
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('Profile not found, initializing empty form');
        setProfile(prev => ({
          ...prev,
          fullName: user?.name || ''
        }));
      } else {
        console.error('Error fetching profile:', error);
      }
    }
  };

  const handleInputChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Step 1: Check if profile exists, then save/update
      let response;
      try {
        await api.get('/profile/me');
        response = await api.put('/profile', {
          fullName: profile.fullName,
          company: profile.company,
          designation: profile.designation,
          location: profile.location || 'N/A',
          bio: profile.bio || 'N/A',
          skills: profile.skills
        });
      } catch (err) {
        if (err.response?.status === 404) {
          response = await api.post('/profile', {
            fullName: profile.fullName,
            company: profile.company,
            designation: profile.designation,
            location: profile.location || 'N/A',
            bio: profile.bio || 'N/A',
            skills: profile.skills
          });
        } else throw err;
      }

      // Step 2: Upload avatar if any
      let finalAvatar = user?.avatar;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('avatar', selectedFile);
        const avatarRes = await api.post('/profile/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalAvatar = avatarRes.data.profile?.avatar || avatarRes.data.avatar;
      }

      // Step 3: Trigger context update to refresh header details immediately
      if (setUser && user) {
        const updatedUser = { 
          ...user, 
          name: profile.fullName || user.name, 
          avatar: finalAvatar || user.avatar 
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      setMessage('Changes saved successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage(error.response?.data?.message || 'Error saving changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-text-main tracking-tight">User Profile</h1>
        <p className="text-text-muted text-sm">Configure your personal information, credentials, and notifications.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success/Error Banner */}
        {message && (
          <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-2 ${
            message.includes('success') 
              ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400' 
              : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
          }`}>
            {message.includes('success') && <Check size={18} />}
            <span>{message}</span>
          </div>
        )}

        {/* Main Grid: Account Details on Left (2 cols wide on large), Preferences on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Account Details Box */}
          <div className="lg:col-span-2 bg-secondary-bg border border-border-color rounded-3xl p-8 shadow-card-shadow">
            <h3 className="text-lg font-bold text-text-main border-b border-border-color pb-3 mb-6">
              Account Details
            </h3>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Left Column: Avatar display and Update btn */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="relative w-36 h-36 rounded-full overflow-hidden bg-primary-bg border-2 border-border-color group">
                  {(preview || profile.avatar || user?.avatar) ? (
                    <img 
                      src={preview || profile.avatar || user?.avatar} 
                      alt="Profile Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted bg-border-color font-extrabold text-4xl">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center text-white cursor-pointer transition-all duration-300">
                    <Camera size={20} className="mb-1" />
                    <span className="text-[10px] uppercase font-bold tracking-wide">Upload</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                
                <label className="inline-flex items-center justify-center gap-2 bg-glass-bg border border-border-color text-text-main rounded-2xl font-semibold text-xs px-4 py-1.5 transition-all duration-200 hover:bg-border-color hover:border-text-muted cursor-pointer">
                  Update
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* Right Column: Inputs */}
              <div className="flex-1 space-y-4">
                {/* Full Name */}
                <div className="m-0 mb-5">
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Full Name</label>
                  <div className="relative flex items-center">
                    <input 
                      type="text"
                      name="fullName"
                      value={profile.fullName}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Alex Martinez"
                      className="w-full bg-input-bg border border-border-color rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-text-main transition-all peer"
                    />
                    <User className="absolute left-[1.15rem] text-text-muted w-[1.15rem] h-[1.15rem] transition-colors duration-200 peer-focus:text-text-main" size={16} />
                  </div>
                </div>

                {/* Email Address (Disabled/Read-only) */}
                <div className="m-0 mb-5 opacity-70">
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Email Address</label>
                  <div className="relative flex items-center">
                    <input 
                      type="email"
                      readOnly
                      value={user?.email || 'alex@synapse.ai'}
                      className="w-full bg-input-bg border border-border-color rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main cursor-not-allowed focus:outline-none"
                    />
                    <Mail className="absolute left-[1.15rem] text-text-muted w-[1.15rem] h-[1.15rem] transition-colors duration-200 peer-focus:text-text-main" size={16} />
                  </div>
                </div>

                {/* Company / Organization */}
                <div className="m-0 mb-5">
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Organization</label>
                  <div className="relative flex items-center">
                    <input 
                      type="text"
                      name="company"
                      value={profile.company}
                      onChange={handleInputChange}
                      placeholder="e.g. Synapse AI"
                      className="w-full bg-input-bg border border-border-color rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-text-main transition-all peer"
                    />
                    <Briefcase className="absolute left-[1.15rem] text-text-muted w-[1.15rem] h-[1.15rem] transition-colors duration-200 peer-focus:text-text-main" size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Box */}
          <div className="lg:col-span-1 bg-secondary-bg border border-border-color rounded-3xl p-8 shadow-card-shadow flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-text-main border-b border-border-color pb-3 mb-6">
                Preferences
              </h3>

              <div className="space-y-6">
                {/* Preference 1 */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-text-main">Email Notifications</h4>
                    <p className="text-xs text-text-muted">Toggles smooth animations</p>
                  </div>
                  <div className="relative inline-block w-12 h-[26px] shrink-0">
                    <input 
                      type="checkbox" 
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="sr-only peer"
                      id="email-notif-toggle"
                    />
                    <label 
                      htmlFor="email-notif-toggle"
                      className="absolute cursor-pointer inset-0 bg-border-color border border-border-color rounded-full transition-colors duration-300 peer-checked:bg-toggle-on-bg peer-checked:border-toggle-on-bg after:content-[''] after:absolute after:h-[18px] after:w-[18px] after:left-[3px] after:bottom-[3px] after:bg-toggle-thumb after:rounded-full after:shadow-md after:transition-transform after:duration-300 peer-checked:after:translate-x-[22px]"
                    />
                  </div>
                </div>

                {/* Preference 2 */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-text-main">Real-time Transcription</h4>
                    <p className="text-xs text-text-muted">Toggles real-time transcription</p>
                  </div>
                  <div className="relative inline-block w-12 h-[26px] shrink-0">
                    <input 
                      type="checkbox" 
                      checked={realtimeTranscription}
                      onChange={(e) => setRealtimeTranscription(e.target.checked)}
                      className="sr-only peer"
                      id="realtime-trans-toggle"
                    />
                    <label 
                      htmlFor="realtime-trans-toggle"
                      className="absolute cursor-pointer inset-0 bg-border-color border border-border-color rounded-full transition-colors duration-300 peer-checked:bg-toggle-on-bg peer-checked:border-toggle-on-bg after:content-[''] after:absolute after:h-[18px] after:w-[18px] after:left-[3px] after:bottom-[3px] after:bg-toggle-thumb after:rounded-full after:shadow-md after:transition-transform after:duration-300 peer-checked:after:translate-x-[22px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions bar */}
        <div className="flex justify-end pt-4 border-t border-border-color">
          <button 
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-linear-to-br from-[#3f3f46] to-[#18181b] dark:from-[#f4f4f5] dark:to-[#a1a1aa] text-white dark:text-zinc-950 rounded-2xl font-semibold text-[0.95rem] px-8 py-3 relative overflow-hidden transition-all duration-300 shadow-md min-h-[46px] hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 before:content-[''] before:absolute before:top-0 before:left-[-150%] before:w-full before:h-full before:bg-[linear-gradient(90deg,transparent,var(--shimmer-color),transparent)] before:transition-all before:duration-700 hover:before:left-[150%] cursor-pointer"
          >
            {loading ? (
              <span>Saving...</span>
            ) : (
              <>
                <span>Save Changes</span>
                <Sparkles size={16} className="text-current" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;


