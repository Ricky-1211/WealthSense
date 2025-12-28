
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { EXPENSE_CATEGORIES } from '../types';
import { Plus, Wallet, AlertCircle, Edit2 } from 'lucide-react';

const BudgetsPage: React.FC = () => {
  const { budgets, updateBudget, transactions } = useAppContext();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState('');

  const getSpent = (category: string) => {
    return transactions
      .filter(t => t.type === 'expense' && t.category === category)
      .reduce((acc, t) => acc + t.amount, 0);
  };

  const activeBudgets = budgets.map(b => ({
    ...b,
    spent: getSpent(b.category)
  }));

  const handleSave = (category: string) => {
    if (!newLimit) return;
    updateBudget({ category, limit: parseFloat(newLimit) });
    setIsEditing(null);
    setNewLimit('');
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Budget Planning</h1>
        <p className="text-slate-500 mt-1">Control your spending by category and avoid over-budgeting.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeBudgets.map(budget => {
          const percent = Math.min((budget.spent / budget.limit) * 100, 100);
          const isOver = budget.spent > budget.limit;

          return (
            <div key={budget.category} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative group overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${isOver ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    <Wallet size={20} />
                  </div>
                  <h3 className="font-bold text-slate-800">{budget.category}</h3>
                </div>
                <button 
                  onClick={() => setIsEditing(budget.category)}
                  className="text-slate-300 hover:text-emerald-500 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
              </div>

              {isEditing === budget.category ? (
                <div className="space-y-3">
                   <input
                    type="number"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    placeholder="New limit"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    autoFocus
                  />
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
                  </div>

                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-4">
                    <div 
                      className={`h-full transition-all duration-1000 rounded-full ${isOver ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}

        <button 
          onClick={() => {
            const cat = EXPENSE_CATEGORIES.find(c => !budgets.find(b => b.category === c));
            if (cat) setIsEditing(cat);
          }}
          className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-emerald-300 hover:text-emerald-500 transition-all group min-h-[160px]"
        >
          <div className="w-12 h-12 rounded-full border-2 border-slate-200 flex items-center justify-center mb-3 group-hover:border-emerald-300 group-hover:bg-emerald-50 transition-all">
            <Plus size={24} />
          </div>
          <span className="font-bold text-sm">Create New Budget</span>
        </button>
      </div>
    </div>
  );
};

export default BudgetsPage;
