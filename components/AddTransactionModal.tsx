
import React, { useState, useEffect } from 'react';
import { X, Calculator } from 'lucide-react';
import { TransactionType, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountRaw, setAmountRaw] = useState('');
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  // Auto-Calculator Logic
  useEffect(() => {
    try {
      // Basic math regex to decide if it's an expression
      if (/^[0-9+\-*/().\s]+$/.test(amountRaw) && /[+\-*/]/.test(amountRaw)) {
        // Safe evaluation (using Function constructor but limited by regex)
        // In a real production app, use a dedicated math parser like mathjs
        const res = new Function(`return ${amountRaw}`)();
        if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
          setCalculatedAmount(Math.max(0, parseFloat(res.toFixed(2))));
        } else {
          setCalculatedAmount(null);
        }
      } else {
        const val = parseFloat(amountRaw);
        setCalculatedAmount(!isNaN(val) ? val : null);
      }
    } catch {
      setCalculatedAmount(null);
    }
  }, [amountRaw]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calculatedAmount || !category || !description) return;

    onAdd({
      amount: calculatedAmount,
      category,
      type,
      date,
      description
    });
    
    // Reset
    setAmountRaw('');
    setCategory('');
    setDescription('');
    onClose();
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 md:p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all animate-in zoom-in-95 duration-200">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-700/50 sticky top-0 z-10">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-200">Add Transaction</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-5">
          <div className="flex p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('');
              }}
              className={`flex-1 py-2 text-xs font-black uppercase rounded-xl transition-all ${
                type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('');
              }}
              className={`flex-1 py-2 text-xs font-black uppercase rounded-xl transition-all ${
                type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'
              }`}
            >
              Income
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1 ml-1">
              <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Amount</label>
              {calculatedAmount !== null && /[+\-*/]/.test(amountRaw) && (
                <span className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                  = ${calculatedAmount.toFixed(2)}
                </span>
              )}
            </div>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-300 dark:text-slate-600 font-bold">$</span>
              <input
                type="text"
                required
                value={amountRaw}
                onChange={(e) => setAmountRaw(e.target.value)}
                className="w-full pl-8 pr-12 py-2.5 md:py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-700 transition-all outline-none text-base md:text-lg font-bold text-slate-800 dark:text-slate-200"
                placeholder="0.00 or 50+20..."
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600">
                <Calculator size={18} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 ml-1 tracking-widest">Category</label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-700 transition-all outline-none font-semibold text-sm appearance-none text-slate-800 dark:text-slate-200"
              >
                <option value="">Select</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 ml-1 tracking-widest">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-700 transition-all outline-none font-semibold text-sm text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 ml-1 tracking-widest">Description</label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-700 transition-all outline-none resize-none font-medium text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="E.g. Monthly groceries..."
            />
          </div>

          <div className="pt-2 flex space-x-2 md:space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 md:py-4 bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-400 font-black text-xs uppercase rounded-xl md:rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 md:py-4 bg-emerald-500 text-white font-black text-xs uppercase rounded-xl md:rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-50 dark:shadow-emerald-900/30 transition-all active:scale-95"
            >
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
