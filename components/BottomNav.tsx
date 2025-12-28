
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  Wallet, 
  Sparkles 
} from 'lucide-react';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; active: boolean }> = ({ to, icon, active }) => (
  <Link
    to={to}
    className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-all touch-manipulation ${
      active ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
    }`}
  >
    <div className={`p-1.5 rounded-full transition-all ${active ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'active:bg-slate-100 dark:active:bg-slate-800'}`}>
      {icon}
    </div>
  </Link>
);

const BottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex items-center justify-around px-1 md:px-2 pb-safe z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] dark:shadow-[0_-4px_10px_rgba(0,0,0,0.3)] safe-area-inset-bottom">
      <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} active={location.pathname === '/dashboard'} />
      <NavItem to="/transactions" icon={<Receipt size={20} />} active={location.pathname === '/transactions'} />
      <NavItem to="/ai-insights" icon={<Sparkles size={20} />} active={location.pathname === '/ai-insights'} />
      <NavItem to="/reports" icon={<PieChart size={20} />} active={location.pathname === '/reports'} />
      <NavItem to="/budgets" icon={<Wallet size={20} />} active={location.pathname === '/budgets'} />
    </nav>
  );
};

export default BottomNav;
