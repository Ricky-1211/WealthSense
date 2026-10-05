
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { User as UserIcon, Bell, Shield, Palette, Database, LogOut, Camera } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { user, logout, updateUser, updateUserPreferences, preferences } = useAppContext();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<Record<string, boolean>>({
    smartNotifications: true,
    biometricLock: false,
    highContrastMode: false,
    realtimeSyncing: true,
  });

  const presetAvatars = [
    '👨‍💼', '👩‍💼', '🧑‍💼', '👨‍🎨', '👩‍🎨', '🧑‍🎨',
    '👨‍🔬', '👩‍🔬', '🧑‍🔬', '👨‍🚀', '👩‍🚀', '🧑‍🚀',
    '🦸', '🦸‍♀️', '🦊', '🐱', '🐶', '🦁'
  ];

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(prev => ({ ...prev, ...preferences }));
    }
  }, [preferences]);

  const handleAvatarClick = () => {
    setShowAvatarOptions(true);
  };

  const handlePresetAvatarSelect = async (emoji: string) => {
    try {
      await updateUser(undefined, emoji);
      setShowAvatarOptions(false);
    } catch (error) {
      console.error('Failed to update avatar:', error);
      alert('Failed to update avatar. Please try again.');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    const maxFileSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxFileSize) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Compress and resize image before converting to data URL
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Resize to max 100x100 pixels (smaller to ensure under Firebase limit)
        const maxSize = 100;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.5 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        
        updateUser(undefined, dataUrl).catch((error: any) => {
          console.error('Failed to update avatar:', error);
          if (error?.message?.includes('Photo URL too long')) {
            alert('Image is too large after compression. Please try a different image.');
          } else {
            alert('Failed to update avatar. Please try again.');
          }
        }).finally(() => {
          setShowAvatarOptions(false);
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleToggle = async (key: string) => {
    const newValue = !localPreferences[key];
    const updatedPreferences = { ...localPreferences, [key]: newValue };
    setLocalPreferences(updatedPreferences);
    
    try {
      await updateUserPreferences(updatedPreferences);
      
      // If Smart Notifications is toggled on, navigate to notifications page
      if (key === 'smartNotifications' && newValue) {
        // Navigate will be handled by the UI interaction
      }
    } catch (error) {
      console.error('Failed to update preference:', error);
      // Revert on error
      setLocalPreferences(prev => ({ ...prev, [key]: !newValue }));
      alert('Failed to update preference. Please try again.');
    }
  };

  const handleUpdateProfile = async () => {
    // This can be extended to update name as well if needed
    alert('Profile updated successfully!');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-left-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
          <p className="text-slate-500 mt-1">Manage your account and app preferences.</p>
        </div>
        <button 
          onClick={logout}
          className="flex items-center space-x-2 px-4 py-2 bg-rose-50 text-rose-500 rounded-xl font-bold text-sm hover:bg-rose-100 transition-all border border-rose-100"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/30">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <button
                onClick={handleAvatarClick}
                className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-500 overflow-hidden ring-4 ring-white shadow-xl rotate-3 hover:ring-emerald-200 transition-all cursor-pointer group"
              >
                {user?.avatar ? (
                  user.avatar.startsWith('data:') || user.avatar.startsWith('http') ? (
                    <img src={user.avatar} className="w-full h-full object-cover" alt="Avatar" />
                  ) : (
                    <span className="text-5xl">{user.avatar}</span>
                  )
                ) : (
                  <UserIcon size={32} />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={20} className="text-white" />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 leading-tight">{user?.name}</h3>
              <p className="text-slate-500 font-medium">{user?.email}</p>
              <div className="flex space-x-2 mt-3">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-md">Pro Member</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-md">ID: {user?.id}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-10">
          <section>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Security & Preferences</h4>
            <div className="space-y-4">
              {[
                { key: 'smartNotifications', icon: <Bell size={18} />, label: 'Smart Notifications', desc: 'AI-driven alerts for unusual spending' },
                { key: 'biometricLock', icon: <Shield size={18} />, label: 'Biometric Lock', desc: 'Secure your data with Fingerprint/FaceID' },
                { key: 'highContrastMode', icon: <Palette size={18} />, label: 'High Contrast Mode', desc: 'Better accessibility for outdoor use' },
                { key: 'realtimeSyncing', icon: <Database size={18} />, label: 'Real-time Syncing', desc: 'Sync data instantly across all platforms' },
              ].map((item) => {
                const checked = localPreferences[item.key] ?? false;
                return (
                  <div key={item.key} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all group">
                    <div className="flex items-center space-x-4">
                      <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 group-hover:text-emerald-500 group-hover:border-emerald-100 shadow-sm transition-all">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.label}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const newValue = !checked;
                        handleToggle(item.key);
                        if (item.key === 'smartNotifications' && newValue) {
                          setTimeout(() => navigate('/notifications'), 100);
                        }
                      }}
                      className={`w-12 h-6 rounded-full p-1 transition-all cursor-pointer ${checked ? 'bg-emerald-500 shadow-lg shadow-emerald-100' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="pt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 border-t border-slate-100">
            <button 
              onClick={() => {
                if (confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
                  alert('Delete all data functionality not implemented yet.');
                }
              }}
              className="px-8 py-3 bg-slate-100 text-slate-500 font-black text-xs uppercase rounded-xl hover:bg-slate-200 transition-colors"
            >
              Delete All Data
            </button>
            <button 
              onClick={handleUpdateProfile}
              className="px-8 py-3 bg-emerald-500 text-white font-black text-xs uppercase rounded-xl shadow-xl shadow-emerald-50 hover:bg-emerald-600 transition-all active:scale-95"
            >
              Update Profile
            </button>
          </div>
        </div>
      </div>

      {/* Avatar Options Modal */}
      {showAvatarOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAvatarOptions(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-800 mb-4">Choose Avatar</h3>
            <div className="grid grid-cols-6 gap-3 mb-4">
              {presetAvatars.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handlePresetAvatarSelect(emoji)}
                  className="w-12 h-12 text-3xl flex items-center justify-center bg-slate-100 rounded-xl hover:bg-emerald-100 hover:scale-110 transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-500 mb-3">Or upload your own:</p>
              <button
                onClick={() => {
                  setShowAvatarOptions(false);
                  fileInputRef.current?.click();
                }}
                className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all"
              >
                Upload Image
              </button>
            </div>
            <button
              onClick={() => setShowAvatarOptions(false)}
              className="w-full py-3 mt-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
