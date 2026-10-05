
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { EXPENSE_CATEGORIES, Budget } from '../types';
import { Plus, Wallet, AlertCircle, Edit2, TrendingUp, Lightbulb, Target, Calendar, ArrowRight } from 'lucide-react';

type TabType = 'budgets' | 'analysis' | 'recommendations';

const BudgetsPage: React.FC = () => {
  const { budgets, updateBudget, transactions } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>('budgets');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState('');
  const [editingBudget, setEditingBudget] = useState<Partial<Budget>>({});

  const getSpent = (category: string, period: 'monthly' | 'weekly' = 'monthly') => {
    const now = new Date();
    const daysAgo = period === 'weekly' ? 7 : 30;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    return transactions
      .filter(t => 
        t.type === 'expense' && 
        t.category === category &&
        new Date(t.date) >= startDate
      )
      .reduce((acc, t) => acc + t.amount, 0);
  };

  const activeBudgets = budgets.map(b => ({
    ...b,
    spent: getSpent(b.category, b.period || 'monthly')
  }));

  // Calculate needs vs wants analysis
  const needsVsWants = useMemo(() => {
    const needs = budgets.filter(b => b.type === 'need').reduce((acc, b) => acc + b.limit, 0);
    const wants = budgets.filter(b => b.type === 'want').reduce((acc, b) => acc + b.limit, 0);
    const total = needs + wants;
    return { needs, wants, total, needsPercent: total > 0 ? (needs / total) * 100 : 0 };
  }, [budgets]);

  // Generate budget recommendations based on historical spending
  const recommendations = useMemo(() => {
    const categorySpending = EXPENSE_CATEGORIES.map(cat => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === cat)
        .reduce((acc, t) => acc + t.amount, 0);
      return { category: cat, spent };
    }).filter(item => item.spent > 0);

    return categorySpending
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5)
      .map(item => ({
        category: item.category,
        suggestedLimit: Math.ceil(item.spent * 1.1), // 10% buffer
        currentBudget: budgets.find(b => b.category === item.category)?.limit || 0,
        hasBudget: budgets.some(b => b.category === item.category)
      }));
  }, [transactions, budgets]);

  const handleSave = (category: string) => {
    if (!newLimit) return;
    const budgetCategory = editingBudget.category || category;
    const { category: _, ...restOfEditing } = editingBudget;
    updateBudget({
      category: budgetCategory,
      limit: parseFloat(newLimit),
      ...restOfEditing
    });
    setIsEditing(null);
    setNewLimit('');
    setEditingBudget({});
  };

  const handleAddBudget = () => {
    const cat = EXPENSE_CATEGORIES.find(c => !budgets.find(b => b.category === c));
    if (cat) {
      setIsEditing('new');
      setEditingBudget({ category: cat, period: 'monthly', type: 'neutral', alertThreshold: 80 });
    } else {
      alert('All categories already have budgets!');
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Smart Budgeting</h1>
        <p className="text-slate-500 mt-1">AI-powered budget management with insights and recommendations.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
        {[
          { id: 'budgets' as TabType, label: 'Budgets', icon: <Wallet size={16} /> },
          { id: 'analysis' as TabType, label: 'Analysis', icon: <TrendingUp size={16} /> },
          { id: 'recommendations' as TabType, label: 'Recommendations', icon: <Lightbulb size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Budgets Tab */}
      {activeTab === 'budgets' && (
        <div className="space-y-6">
          {/* New Budget Form */}
          {isEditing === 'new' && (
            <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Create New Budget</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Category</label>
                  <p className="text-lg font-bold text-emerald-600">{editingBudget.category}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Limit</label>
                  <input
                    type="number"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    placeholder="Enter limit"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Period</label>
                    <select
                      value={editingBudget.period || 'monthly'}
                      onChange={(e) => setEditingBudget({ ...editingBudget, period: e.target.value as 'monthly' | 'weekly' })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Type</label>
                    <select
                      value={editingBudget.type || 'neutral'}
                      onChange={(e) => setEditingBudget({ ...editingBudget, type: e.target.value as 'need' | 'want' | 'neutral' })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    >
                      <option value="neutral">Neutral</option>
                      <option value="need">Need</option>
                      <option value="want">Want</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rollover-new"
                    checked={editingBudget.rollover || false}
                    onChange={(e) => setEditingBudget({ ...editingBudget, rollover: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="rollover-new" className="text-sm text-slate-600">Enable rollover</label>
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => handleSave(editingBudget.category || '')}
                    className="flex-1 py-2 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-all"
                  >
                    Create Budget
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditing(null);
                      setNewLimit('');
                      setEditingBudget({});
                    }}
                    className="flex-1 py-2 bg-slate-100 text-slate-500 rounded-lg font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeBudgets.map(budget => {
              const percent = Math.min((budget.spent / budget.limit) * 100, 100);
              const isOver = budget.spent > budget.limit;
              const isNearLimit = percent >= (budget.alertThreshold || 80) && !isOver;

              return (
              <div key={budget.category} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative group overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${isOver ? 'bg-rose-50 text-rose-500' : isNearLimit ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                      <Wallet size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{budget.category}</h3>
                      <span className="text-[10px] font-bold uppercase text-slate-400">{budget.period || 'monthly'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsEditing(budget.category);
                      setEditingBudget(budget);
                    }}
                    className="text-slate-300 hover:text-emerald-500 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>

                {isEditing === budget.category ? (
                  <div className="space-y-3">
                    <input
                      type="number"
                      value={newLimit || budget.limit}
                      onChange={(e) => setNewLimit(e.target.value)}
                      placeholder="New limit"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      autoFocus
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={editingBudget.period || 'monthly'}
                        onChange={(e) => setEditingBudget({ ...editingBudget, period: e.target.value as 'monthly' | 'weekly' })}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                      </select>
                      <select
                        value={editingBudget.type || 'neutral'}
                        onChange={(e) => setEditingBudget({ ...editingBudget, type: e.target.value as 'need' | 'want' | 'neutral' })}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      >
                        <option value="neutral">Neutral</option>
                        <option value="need">Need</option>
                        <option value="want">Want</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`rollover-${budget.category}`}
                        checked={editingBudget.rollover || false}
                        onChange={(e) => setEditingBudget({ ...editingBudget, rollover: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor={`rollover-${budget.category}`} className="text-xs text-slate-600">Enable rollover</label>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleSave(budget.category)}
                        className="flex-1 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-bold"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setIsEditing(null)}
                        className="flex-1 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-sm font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <p className="text-2xl font-black text-slate-900">${budget.spent.toFixed(0)}</p>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Spent of ${budget.limit.toFixed(0)}</p>
                      </div>
                      {isOver && (
                        <div className="flex items-center space-x-1 text-rose-500 animate-pulse">
                          <AlertCircle size={14} />
                          <span className="text-[10px] font-black uppercase">Exceeded</span>
                        </div>
                      )}
                      {isNearLimit && (
                        <div className="flex items-center space-x-1 text-amber-500">
                          <AlertCircle size={14} />
                          <span className="text-[10px] font-black uppercase">Near Limit</span>
                        </div>
                      )}
                    </div>

                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-4">
                      <div 
                        className={`h-full transition-all duration-1000 rounded-full ${isOver ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    {budget.rollover && (
                      <div className="mt-2 text-[10px] text-emerald-600 font-bold uppercase">Rollover Enabled</div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          <button 
            onClick={handleAddBudget}
            className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-emerald-300 hover:text-emerald-500 transition-all group min-h-[160px]"
          >
            <div className="w-12 h-12 rounded-full border-2 border-slate-200 flex items-center justify-center mb-3 group-hover:border-emerald-300 group-hover:bg-emerald-50 transition-all">
              <Plus size={24} />
            </div>
            <span className="font-bold text-sm">Create New Budget</span>
          </button>
        </div>
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <Target size={20} className="text-emerald-500" />
              <span>Needs vs Wants Analysis</span>
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Needs</span>
                  <span className="text-sm font-bold text-slate-800">${needsVsWants.needs.toFixed(0)}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${needsVsWants.needsPercent}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Wants</span>
                  <span className="text-sm font-bold text-slate-800">${needsVsWants.wants.toFixed(0)}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${100 - needsVsWants.needsPercent}%` }} />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  {needsVsWants.needsPercent > 70 ? '⚠️ High needs ratio. Consider reducing essential expenses.' :
                   needsVsWants.needsPercent < 30 ? '✅ Healthy balance between needs and wants.' :
                   'ℹ️ Balanced spending between needs and wants.'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <Calendar size={20} className="text-emerald-500" />
              <span>Budget Periods</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Monthly Budgets</p>
                <p className="text-2xl font-black text-slate-800">{budgets.filter(b => b.period === 'monthly' || !b.period).length}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Weekly Budgets</p>
                <p className="text-2xl font-black text-slate-800">{budgets.filter(b => b.period === 'weekly').length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <Lightbulb size={20} className="text-emerald-500" />
              <span>AI Budget Recommendations</span>
            </h3>
            <p className="text-sm text-slate-500 mb-4">Based on your historical spending patterns</p>
            
            {recommendations.length === 0 ? (
              <p className="text-sm text-slate-400">No spending data available for recommendations.</p>
            ) : (
              <div className="space-y-3">
                {recommendations.map(rec => (
                  <div key={rec.category} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-500">
                        <Wallet size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{rec.category}</p>
                        <p className="text-xs text-slate-500">Suggested: ${rec.suggestedLimit}</p>
                      </div>
                    </div>
                    {!rec.hasBudget ? (
                      <button
                        onClick={() => {
                          setIsEditing(rec.category);
                          setEditingBudget({ period: 'monthly', type: 'neutral', alertThreshold: 80 });
                          setNewLimit(rec.suggestedLimit.toString());
                          setActiveTab('budgets');
                        }}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 transition-all"
                      >
                        <span>Create</span>
                        <ArrowRight size={14} />
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 font-bold">✓ Budget exists</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-2xl border border-emerald-100">
            <h4 className="font-bold text-slate-800 mb-2">💡 Zero-Based Budgeting Tip</h4>
            <p className="text-sm text-slate-600">
              Assign every dollar a purpose before the month begins. Income minus expenses should equal zero. 
              This ensures intentional spending and maximum savings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetsPage;
