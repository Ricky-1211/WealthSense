
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  Wallet, 
  Sparkles,
  PiggyBank,
  Shield,
  Calendar,
  Settings,
  MoreVertical,
  X
} from 'lucide-react';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; active: boolean; label?: string }> = ({ to, icon, active, label }) => (
  <Link
    to={to}
    className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-all touch-manipulation min-w-0 ${
      active ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
    }`}
    aria-label={label}
  >
    <div className={`p-1.5 rounded-full transition-all ${active ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'active:bg-slate-100 dark:active:bg-slate-800'}`}>
      {icon}
    </div>
    {label && (
      <span className="text-[10px] mt-0.5 font-medium truncate w-full text-center">{label}</span>
    )}
  </Link>
);

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const primaryItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/transactions', icon: <Receipt size={20} />, label: 'Transactions' },
    { to: '/reports', icon: <PieChart size={20} />, label: 'Reports' },
    { to: '/budgets', icon: <Wallet size={20} />, label: 'Budgets' },
  ];

  const moreItems = [
    { to: '/ai-insights', icon: <Sparkles size={18} />, label: 'AI Insights' },
    { to: '/savings', icon: <PiggyBank size={18} />, label: 'Savings' },
    { to: '/tracking', icon: <Shield size={18} />, label: 'Tracking' },
    { to: '/calendar', icon: <Calendar size={18} />, label: 'Calendar' },
    { to: '/settings', icon: <Settings size={18} />, label: 'Settings' },
  ];

  const handleMoreItemClick = (to: string) => {
    navigate(to);
    setShowMoreMenu(false);
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex items-center justify-around px-1 pb-safe z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] dark:shadow-[0_-4px_10px_rgba(0,0,0,0.3)] safe-area-inset-bottom">
        {primaryItems.map((item) => (
          <NavItem 
            key={item.to} 
            to={item.to} 
            icon={item.icon} 
            active={location.pathname === item.to}
            label={item.label}
          />
        ))}
        <button
          onClick={() => setShowMoreMenu(true)}
          className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-all touch-manipulation min-w-0 ${
            moreItems.some(item => location.pathname === item.to)
              ? 'text-emerald-500 dark:text-emerald-400' 
              : 'text-slate-400 dark:text-slate-500'
          }`}
          aria-label="More"
        >
          <div className={`p-1.5 rounded-full transition-all ${moreItems.some(item => location.pathname === item.to) ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'active:bg-slate-100 dark:active:bg-slate-800'}`}>
            <MoreVertical size={20} />
          </div>
          <span className="text-[10px] mt-0.5 font-medium">More</span>
        </button>
      </nav>

      {/* More Menu Modal */}
      {showMoreMenu && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] md:hidden"
          onClick={() => setShowMoreMenu(false)}
        >
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl pb-safe safe-area-inset-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">More Options</h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {moreItems.map((item) => (
                <button
                  key={item.to}
                  onClick={() => handleMoreItemClick(item.to)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    location.pathname === item.to
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className={location.pathname === item.to ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}>
                    {item.icon}
                  </div>
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNav;
