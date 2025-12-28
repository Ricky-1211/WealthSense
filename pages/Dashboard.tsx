
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import StatCard from '../components/StatCard';
import TransactionTable from '../components/TransactionTable';
import AddTransactionModal from '../components/AddTransactionModal';
import { Wallet, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

const Dashboard: React.FC = () => {
  const { transactions, addTransaction, deleteTransaction } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return {
      balance: income - expense,
      income,
      expense
    };
  }, [transactions]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const recentDaysData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayTransactions = transactions.filter(t => t.date === date);
      return {
        date: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
        income: dayTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
        expense: dayTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
      };
    });
  }, [transactions]);

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">Dashboard Overview</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Good morning! Here's what's happening with your money.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 text-sm md:text-base w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>Add Transaction</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          title="Total Balance"
          amount={stats.balance}
          icon={<Wallet size={24} />}
          color="blue"
        />
        <StatCard
          title="Total Income"
          amount={stats.income}
          icon={<TrendingUp size={24} />}
          color="emerald"
          trend="+12.5%"
        />
        <StatCard
          title="Total Expenses"
          amount={stats.expense}
          icon={<TrendingDown size={24} />}
          color="rose"
          trend="-3.2%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 md:mb-6">Cash Flow (Last 7 Days)</h2>
          <div className="h-64 md:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentDaysData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 md:mb-6">Spending by Category</h2>
          <div className="h-64 md:h-72 w-full flex flex-col items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 italic">No expense data yet</p>
            )}
            <div className="grid grid-cols-2 gap-4 mt-4 w-full px-4">
              {categoryData.slice(0, 4).map((c, i) => (
                <div key={c.name} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-slate-600 truncate">{c.name}</span>
                  <span className="text-xs font-bold text-slate-800">${c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200">Recent Transactions</h2>
          <button className="text-emerald-500 text-xs md:text-sm font-semibold hover:underline">View All</button>
        </div>
        <TransactionTable transactions={transactions} onDelete={deleteTransaction} limit={5} />
      </div>

      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={addTransaction} 
      />
    </div>
  );
};

export default Dashboard;
