
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  Wallet, 
  Sparkles, 
  Settings, 
  TrendingUp,
  Calendar,
  PiggyBank,
  Shield
} from 'lucide-react';

const SidebarItem: React.FC<{ 
  to: string; 
  icon: React.ReactNode; 
  label: string; 
  active: boolean 
}> = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}
  >
    {icon}
    <span className="font-medium text-sm md:text-base">{label}</span>
  </Link>
);

const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/transactions', icon: <Receipt size={20} />, label: 'Transactions' },
    { to: '/reports', icon: <PieChart size={20} />, label: 'Reports' },
    { to: '/budgets', icon: <Wallet size={20} />, label: 'Budgets' },
    { to: '/savings', icon: <PiggyBank size={20} />, label: 'Savings Tracker' },
    { to: '/tracking', icon: <Shield size={20} />, label: 'Tracking' },
    { to: '/ai-insights', icon: <Sparkles size={20} />, label: 'AI Insights' },
    { to: '/calendar', icon: <Calendar size={20} />, label: 'Calendar' },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col hidden md:flex shrink-0">
      <div className="p-4 md:p-6 flex items-center space-x-2">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
          <TrendingUp className="text-white" size={18} />
        </div>
        <h1 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-200 truncate">WealthSense</h1>
      </div>

      <nav className="flex-1 px-3 md:px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            active={location.pathname === item.to}
          />
        ))}
      </nav>

      <div className="p-3 md:p-4 mt-auto border-t border-slate-100 dark:border-slate-700">
        <SidebarItem
          to="/settings"
          icon={<Settings size={20} />}
          label="Settings"
          active={location.pathname === '/settings'}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
