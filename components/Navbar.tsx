
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Bell, Search, User as UserIcon, CloudSync, CloudCheck, Database, Clock, Moon, Sun, Menu } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

const Navbar: React.FC = () => {
  const { user, isSyncing, preferences, updateUserPreferences } = useAppContext();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const isDarkMode = preferences?.darkMode || false;
  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    
    return `${hours}:${formattedMinutes}:${formattedSeconds} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getDay()];
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${dayName}, ${month} ${day}, ${year}`;
  };

  const toggleDarkMode = async () => {
    await updateUserPreferences({ ...preferences, darkMode: !isDarkMode });
    // Apply dark mode class to html element
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Apply dark mode on mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <header className="h-14 md:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-3 md:px-4 lg:px-8 z-10 sticky top-0">
      {!isMobile && (
        <div className="relative w-full max-w-xs md:max-w-md hidden sm:block">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
              <Clock size={18} className="text-slate-400 dark:text-slate-500" />
              <span className="font-mono font-bold text-sm tracking-wider">
                {formatTime(currentTime)}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {formatDate(currentTime)}
            </div>
          </div>
        </div>
      )}

      {isMobile && (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">WS</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
              {formatTime(currentTime)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2 md:space-x-3 lg:space-x-6">
        {!isMobile && (
          <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500">
            {isSyncing ? (
              <CloudSync size={20} className="text-emerald-500 animate-spin" />
            ) : (
              <CloudCheck size={20} className="text-emerald-400 dark:text-emerald-500" />
            )}
          </div>
        )}

        <button 
          onClick={toggleDarkMode}
          className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1.5 md:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun size={isMobile ? 18 : 20} /> : <Moon size={isMobile ? 18 : 20} />}
        </button>

        <button 
          onClick={() => navigate('/notifications')}
          className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-1 relative"
        >
          <Bell size={isMobile ? 18 : 20} />
        </button>
        
        <div className={`flex items-center space-x-2 ${!isMobile ? 'md:space-x-3 border-l border-slate-100 dark:border-slate-700 pl-4' : ''}`}>
          {!isMobile && (
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">{user?.name || 'Guest User'}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-tighter">Member</p>
            </div>
          )}
          <button 
            onClick={() => navigate('/settings')}
            className={`${isMobile ? 'w-8 h-8' : 'w-9 h-9'} rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden ring-2 ring-emerald-100 dark:ring-emerald-900 shrink-0 cursor-pointer hover:ring-emerald-200 dark:hover:ring-emerald-800 transition-all`}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                <UserIcon size={isMobile ? 16 : 18} />
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
