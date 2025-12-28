
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import TransactionTable from '../components/TransactionTable';
import { Search, Filter, Plus, FileText, Download } from 'lucide-react';
import AddTransactionModal from '../components/AddTransactionModal';

const TransactionsPage: React.FC = () => {
  const { transactions, deleteTransaction, addTransaction } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">All Transactions</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Review and manage your complete transaction history.</p>
        </div>
        <div className="flex items-center space-x-2 md:space-x-3">
          <button className="hidden sm:flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-3 md:px-4 py-2 md:py-2.5 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm">
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 md:px-4 py-2 md:py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-100 dark:shadow-emerald-900/30 transition-all active:scale-95 text-sm md:text-base flex-1 sm:flex-initial justify-center"
          >
            <Plus size={18} />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3 md:gap-4">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search by name or category..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-700 transition-all text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
            {(['all', 'income', 'expense'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2 md:px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${
                  filterType === type ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <button className="hidden sm:block p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden min-h-[400px]">
        <TransactionTable transactions={filteredTransactions} onDelete={deleteTransaction} />
      </div>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addTransaction}
      />
    </div>
  );
};

export default TransactionsPage;
