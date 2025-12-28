
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Bell, BellOff, AlertCircle, TrendingUp, TrendingDown, DollarSign, X, CheckCircle, Info } from 'lucide-react';

interface Notification {
  id: string;
  type: 'spending' | 'income' | 'budget' | 'info';
  title: string;
  message: string;
  amount?: number;
  date: string;
  read: boolean;
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, transactions, budgets } = useAppContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

  // Generate real notifications from transactions and budgets
  const generatedNotifications = useMemo(() => {
    const notifs: Notification[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get current month transactions
    const currentMonthTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });

    // Get last 7 days transactions
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const weeklyTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= last7Days;
    });

    // 1. Budget Overrun Warnings
    budgets.forEach(budget => {
      const spent = currentMonthTransactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((acc, t) => acc + t.amount, 0);
      
      const percent = (spent / budget.limit) * 100;
      
      if (spent > budget.limit) {
        notifs.push({
          id: `budget-${budget.category}`,
          type: 'budget',
          title: 'Budget Exceeded',
          message: `You've exceeded your ${budget.category} budget by $${(spent - budget.limit).toFixed(0)}.`,
          amount: spent - budget.limit,
          date: new Date().toISOString(),
          read: readNotifications.has(`budget-${budget.category}`),
        });
      } else if (percent >= 90) {
        notifs.push({
          id: `budget-warning-${budget.category}`,
          type: 'budget',
          title: 'Budget Warning',
          message: `You've reached ${percent.toFixed(0)}% of your ${budget.category} budget for this month.`,
          amount: spent,
          date: new Date().toISOString(),
          read: readNotifications.has(`budget-warning-${budget.category}`),
        });
      }
    });

    // 2. Spending Alerts - Unusual spending patterns
    const categorySpending: Record<string, number> = {};
    weeklyTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
      });

    // Calculate average spending per category (last 30 days)
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const monthlyTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= last30Days && t.type === 'expense';
    });

    const categoryAverages: Record<string, number> = {};
    monthlyTransactions.forEach(t => {
      categoryAverages[t.category] = (categoryAverages[t.category] || 0) + t.amount;
    });

    Object.keys(categorySpending).forEach(category => {
      const weeklySpent = categorySpending[category];
      const monthlyAvg = categoryAverages[category] || 0;
      const weeklyAvg = monthlyAvg / 4; // Approximate weekly average
      
      if (weeklyAvg > 0 && weeklySpent > weeklyAvg * 1.5) {
        const increasePercent = ((weeklySpent - weeklyAvg) / weeklyAvg) * 100;
        notifs.push({
          id: `spending-${category}-${Date.now()}`,
          type: 'spending',
          title: 'Unusual Spending Detected',
          message: `You spent $${weeklySpent.toFixed(0)} on ${category} this week, which is ${increasePercent.toFixed(0)}% above your average.`,
          amount: weeklySpent,
          date: new Date().toISOString(),
          read: readNotifications.has(`spending-${category}-${Date.now()}`),
        });
      }
    });

    // 3. Weekly Top Spending Notification
    if (weeklyTransactions.filter(t => t.type === 'expense').length > 0) {
      const topCategory = Object.entries(categorySpending)
        .sort(([, a], [, b]) => b - a)[0];
      
      if (topCategory && topCategory[1] > 0) {
        notifs.push({
          id: `weekly-top-${Date.now()}`,
          type: 'spending',
          title: 'Weekly Top Spending',
          message: `Your top spending category this week is ${topCategory[0]} with $${topCategory[1].toFixed(0)}.`,
          amount: topCategory[1],
          date: new Date().toISOString(),
          read: readNotifications.has(`weekly-top-${Date.now()}`),
        });
      }
    }

    // 4. Large Income Detection
    const largeIncomes = currentMonthTransactions
      .filter(t => t.type === 'income' && t.amount > 1000);
    
    largeIncomes.forEach(t => {
      notifs.push({
        id: `income-${t.id}`,
        type: 'income',
        title: 'Large Income Detected',
        message: `You received a ${t.category} payment of $${t.amount.toFixed(0)}.`,
        amount: t.amount,
        date: t.date,
        read: readNotifications.has(`income-${t.id}`),
      });
    });

    // Sort by date (newest first)
    return notifs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, budgets, readNotifications]);

  useEffect(() => {
    setNotifications(generatedNotifications);
  }, [generatedNotifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'spending':
        return <TrendingDown size={20} className="text-rose-500" />;
      case 'income':
        return <TrendingUp size={20} className="text-emerald-500" />;
      case 'budget':
        return <AlertCircle size={20} className="text-amber-500" />;
      case 'info':
        return <Info size={20} className="text-blue-500" />;
      default:
        return <Bell size={20} className="text-slate-400" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'spending':
        return 'bg-rose-50 border-rose-100';
      case 'income':
        return 'bg-emerald-50 border-emerald-100';
      case 'budget':
        return 'bg-amber-50 border-amber-100';
      case 'info':
        return 'bg-blue-50 border-blue-100';
      default:
        return 'bg-slate-50 border-slate-100';
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const markAsRead = (id: string) => {
    setReadNotifications(prev => new Set([...prev, id]));
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifications(prev => new Set([...prev, ...allIds]));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!preferences?.smartNotifications) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-left-4 duration-500">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
              <BellOff size={32} className="text-slate-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Smart Notifications Disabled</h2>
              <p className="text-slate-500">Enable Smart Notifications in Settings to receive AI-driven alerts.</p>
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="px-6 py-3 bg-emerald-500 text-white font-bold text-sm rounded-xl hover:bg-emerald-600 transition-all mt-4"
            >
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-left-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Smart Notifications</h1>
          <p className="text-slate-500 mt-1">AI-driven alerts for your financial activity.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs hover:bg-emerald-200 transition-all"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">All Caught Up!</h2>
              <p className="text-slate-500">You have no new notifications.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all hover:shadow-md ${
                notification.read 
                  ? `${getNotificationBg(notification.type)} opacity-75` 
                  : `${getNotificationBg(notification.type)}`
              }`}
            >
              <div className="p-5 flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  notification.read ? 'bg-white/50' : 'bg-white shadow-sm'
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`text-sm font-black ${notification.read ? 'text-slate-600' : 'text-slate-800'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        )}
                      </div>
                      <p className={`text-xs ${notification.read ? 'text-slate-400' : 'text-slate-600'} mb-2`}>
                        {notification.message}
                      </p>
                      {notification.amount && (
                        <div className="flex items-center space-x-1 mt-2">
                          <DollarSign size={14} className="text-slate-400" />
                          <span className="text-sm font-black text-slate-800">
                            {notification.amount.toLocaleString('en-US', { 
                              style: 'currency', 
                              currency: 'USD',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            })}
                          </span>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">
                        {formatTimeAgo(notification.date)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 shrink-0 ml-4">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <CheckCircle size={18} className="text-slate-400 hover:text-emerald-500" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <X size={18} className="text-slate-400 hover:text-rose-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-3xl border border-emerald-100 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <Bell size={20} className="text-emerald-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-slate-800 mb-1">About Smart Notifications</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Get intelligent alerts about unusual spending patterns, budget warnings, large transactions, and important financial insights powered by AI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;

