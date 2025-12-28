
import React from 'react';
import { Transaction } from '../types';
import { ArrowUpCircle, ArrowDownCircle, Trash2 } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  limit?: number;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onDelete, limit }) => {
  const displayList = limit ? transactions.slice(0, limit) : transactions;

  return (
    <div className="overflow-x-auto -mx-4 md:mx-0">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
            <th className="px-3 md:px-4 py-3 md:py-4">Description</th>
            <th className="px-3 md:px-4 py-3 md:py-4 hidden sm:table-cell">Category</th>
            <th className="px-3 md:px-4 py-3 md:py-4 hidden md:table-cell">Date</th>
            <th className="px-3 md:px-4 py-3 md:py-4 text-right">Amount</th>
            <th className="px-3 md:px-4 py-3 md:py-4 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
          {displayList.map((t) => (
            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
              <td className="px-3 md:px-4 py-3 md:py-4">
                <div className="flex items-center space-x-2 md:space-x-3">
                  {t.type === 'income' ? (
                    <ArrowUpCircle className="text-emerald-500 shrink-0" size={18} />
                  ) : (
                    <ArrowDownCircle className="text-rose-500 shrink-0" size={18} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{t.description}</p>
                    <div className="sm:hidden mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-medium">
                        {t.category}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-2">
                        {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-3 md:px-4 py-3 md:py-4 hidden sm:table-cell">
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-medium">
                  {t.category}
                </span>
              </td>
              <td className="px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm text-slate-500 dark:text-slate-400 hidden md:table-cell">
                {new Date(t.date).toLocaleDateString()}
              </td>
              <td className={`px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm font-bold text-right ${
                t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
              }`}>
                {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
              </td>
              <td className="px-3 md:px-4 py-3 md:py-4 text-center">
                <button
                  onClick={() => onDelete(t.id)}
                  className="text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 md:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
          {displayList.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center py-12 text-slate-400 dark:text-slate-500 italic">
                No transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
