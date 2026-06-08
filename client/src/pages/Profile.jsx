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
  const { user, login } = useAuth();
  const [profile, setProfile] = useState({
    fullName: '',
    company: '',
    designation: '',
    location: '',
    bio: '',
    skills: ''
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

      // Step 3: Trigger login context update to refresh header details immediately
      if (login && user) {
        const updatedUser = { 
          ...user, 
          name: profile.fullName || user.name, 
          avatar: finalAvatar || user.avatar 
        };
        await login(updatedUser, localStorage.getItem('accessToken'), localStorage.getItem('refreshToken'));
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
        <h1 className="text-3xl font-extrabold text-(--text-main) tracking-tight">User Profile</h1>
        <p className="text-(--text-muted) text-sm">Configure your personal information, credentials, and notifications.</p>
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
          <div className="lg:col-span-2 premium-card">
            <h3 className="text-lg font-bold text-(--text-main) border-b border-(--border-color) pb-3 mb-6">
              Account Details
            </h3>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Left Column: Avatar display and Update btn */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="relative w-36 h-36 rounded-full overflow-hidden bg-(--primary-bg) border-2 border-(--border-color) group">
                  {(preview || profile.avatar || user?.avatar) ? (
                    <img 
                      src={preview || profile.avatar || user?.avatar} 
                      alt="Profile Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-(--text-muted) bg-(--border-color) font-extrabold text-4xl">
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
                
                <label className="btn-glass py-1.5 px-4 text-xs cursor-pointer">
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
                <div className="form-group m-0">
                  <label className="block text-xs font-bold text-(--text-muted) mb-1.5">Full Name</label>
                  <div className="input-icon-wrapper">
                    <input 
                      type="text"
                      name="fullName"
                      value={profile.fullName}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Alex Martinez"
                      className="w-full bg-(--input-bg) border border-(--border-color) rounded-xl pl-10 pr-4 py-2.5 text-sm text-(--text-main) focus:outline-none focus:border-(--text-main) transition-all"
                    />
                    <User className="input-icon" size={16} />
                  </div>
                </div>

                {/* Email Address (Disabled/Read-only) */}
                <div className="form-group m-0 opacity-70">
                  <label className="block text-xs font-bold text-(--text-muted) mb-1.5">Email Address</label>
                  <div className="input-icon-wrapper">
                    <input 
                      type="email"
                      readOnly
                      value={user?.email || 'alex@synapse.ai'}
                      className="w-full bg-(--input-bg) border border-(--border-color) rounded-xl pl-10 pr-4 py-2.5 text-sm text-(--text-main) cursor-not-allowed focus:outline-none"
                    />
                    <Mail className="input-icon" size={16} />
                  </div>
                </div>

                {/* Company / Organization */}
                <div className="form-group m-0">
                  <label className="block text-xs font-bold text-(--text-muted) mb-1.5">Organization</label>
                  <div className="input-icon-wrapper">
                    <input 
                      type="text"
                      name="company"
                      value={profile.company}
                      onChange={handleInputChange}
                      placeholder="e.g. Synapse AI"
                      className="w-full bg-(--input-bg) border border-(--border-color) rounded-xl pl-10 pr-4 py-2.5 text-sm text-(--text-main) focus:outline-none focus:border-(--text-main) transition-all"
                    />
                    <Briefcase className="input-icon" size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Box */}
          <div className="lg:col-span-1 premium-card flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-(--text-main) border-b border-(--border-color) pb-3 mb-6">
                Preferences
              </h3>

              <div className="space-y-6">
                {/* Preference 1 */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-(--text-main)">Email Notifications</h4>
                    <p className="text-xs text-(--text-muted)">Toggles smooth animations</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {/* Preference 2 */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-(--text-main)">Real-time Transcription</h4>
                    <p className="text-xs text-(--text-muted)">Toggles real-time transcription</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={realtimeTranscription}
                      onChange={(e) => setRealtimeTranscription(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions bar */}
        <div className="flex justify-end pt-4 border-t border-(--border-color)">
          <button 
            type="submit"
            disabled={loading}
            className="btn-metallic py-3 px-8 flex items-center gap-2"
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


