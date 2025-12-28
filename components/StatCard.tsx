
import React from 'react';

interface StatCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  color: 'emerald' | 'rose' | 'blue';
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, amount, icon, color, trend }) => {
  const colorClasses = {
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    rose: 'bg-rose-50 text-rose-600 ring-rose-100',
    blue: 'bg-blue-50 text-blue-600 ring-blue-100'
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className={`p-2 md:p-3 rounded-xl ring-2 ${colorClasses[color]} shrink-0`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[10px] md:text-xs font-semibold px-2 py-1 rounded-full ${
            trend.startsWith('+') ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium">{title}</p>
      <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
        ${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </h3>
    </div>
  );
};

export default StatCard;
