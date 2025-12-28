import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { SavingsData, SavingsEntry } from '../types';
import { PiggyBank, Plus, Trash2, Calculator, DollarSign, TrendingUp, Calendar, Percent } from 'lucide-react';

const SavingsProgressPage: React.FC = () => {
  const { savings, updateSavingsData, addSavingsEntry, deleteSavingsEntry, transactions } = useAppContext();
  const [monthlySalary, setMonthlySalary] = useState(savings?.monthlySalary || 0);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [newEntryAmount, setNewEntryAmount] = useState('');
  const [newEntryDate, setNewEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEntryDescription, setNewEntryDescription] = useState('');
  
  // Calculator state
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcValue, setCalcValue] = useState(0);
  const [calcOperation, setCalcOperation] = useState<string | null>(null);
  const [calcWaitingForOperand, setCalcWaitingForOperand] = useState(false);

  useEffect(() => {
    if (savings?.monthlySalary) {
      setMonthlySalary(savings.monthlySalary);
    }
  }, [savings]);

  // Get current month savings entries
  const currentMonthEntries = useMemo(() => {
    if (!savings?.entries) return [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return savings.entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    });
  }, [savings]);

  // Calculate total savings for current month
  const totalSavings = useMemo(() => {
    return currentMonthEntries.reduce((sum, entry) => sum + entry.amount, 0);
  }, [currentMonthEntries]);

  // Calculate total expenses for current month
  const totalExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions
      .filter(t => {
        const txDate = new Date(t.date);
        return txDate.getMonth() === currentMonth && 
               txDate.getFullYear() === currentYear && 
               t.type === 'expense';
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Calculate savings percentage
  const savingsPercentage = useMemo(() => {
    if (monthlySalary === 0) return 0;
    return (totalSavings / monthlySalary) * 100;
  }, [totalSavings, monthlySalary]);

  // Calculate remaining salary
  const remainingSalary = useMemo(() => {
    return Math.max(0, monthlySalary - totalExpenses - totalSavings);
  }, [monthlySalary, totalExpenses, totalSavings]);

  // Group entries by day
  const entriesByDay = useMemo(() => {
    const grouped: Record<string, SavingsEntry[]> = {};
    currentMonthEntries.forEach(entry => {
      const day = entry.date;
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(entry);
    });
    return grouped;
  }, [currentMonthEntries]);

  const handleSaveSalary = async () => {
    const updatedSavings: SavingsData = {
      monthlySalary,
      entries: savings?.entries || [],
      updatedAt: new Date().toISOString()
    };
    await updateSavingsData(updatedSavings);
  };

  const handleAddEntry = async () => {
    if (!newEntryAmount || parseFloat(newEntryAmount) <= 0) return;
    
    await addSavingsEntry({
      date: newEntryDate,
      amount: parseFloat(newEntryAmount),
      description: newEntryDescription || undefined
    });
    
    setNewEntryAmount('');
    setNewEntryDescription('');
    setIsAddingEntry(false);
  };

  const handleDeleteEntry = async (entryId: string) => {
    await deleteSavingsEntry(entryId);
  };

  // Calculator functions
  const handleCalcInput = (value: string) => {
    if (calcWaitingForOperand) {
      setCalcDisplay(value);
      setCalcWaitingForOperand(false);
    } else {
      setCalcDisplay(calcDisplay === '0' ? value : calcDisplay + value);
    }
  };

  const handleCalcOperation = (op: string) => {
    const inputValue = parseFloat(calcDisplay);
    
    if (calcValue === 0) {
      setCalcValue(inputValue);
    } else if (calcOperation) {
      const result = performCalculation();
      setCalcValue(result);
      setCalcDisplay(String(result));
    }
    
    setCalcWaitingForOperand(true);
    setCalcOperation(op);
  };

  const performCalculation = (): number => {
    const inputValue = parseFloat(calcDisplay);
    
    switch (calcOperation) {
      case '+':
        return calcValue + inputValue;
      case '-':
        return calcValue - inputValue;
      case '*':
        return calcValue * inputValue;
      case '/':
        return calcValue / inputValue;
      default:
        return inputValue;
    }
  };

  const handleCalcEquals = () => {
    if (calcOperation) {
      const result = performCalculation();
      setCalcDisplay(String(result));
      setCalcValue(0);
      setCalcOperation(null);
      setCalcWaitingForOperand(true);
    }
  };

  const handleCalcClear = () => {
    setCalcDisplay('0');
    setCalcValue(0);
    setCalcOperation(null);
    setCalcWaitingForOperand(false);
  };

  const useCalcValue = () => {
    setNewEntryAmount(calcDisplay);
    handleCalcClear();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Savings Progress Tracker</h1>
        <p className="text-slate-500 mt-1">Track your daily savings and monitor your progress.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign size={24} className="text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 uppercase">Total Saved</span>
              </div>
              <p className="text-3xl font-black text-emerald-900">
                ${totalSavings.toFixed(2)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <Percent size={24} className="text-blue-600" />
                <span className="text-xs font-bold text-blue-700 uppercase">Savings %</span>
              </div>
              <p className="text-3xl font-black text-blue-900">
                {savingsPercentage.toFixed(1)}%
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border border-amber-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp size={24} className="text-amber-600" />
                <span className="text-xs font-bold text-amber-700 uppercase">Remaining</span>
              </div>
              <p className="text-3xl font-black text-amber-900">
                ${remainingSalary.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Salary Input */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Calendar size={20} className="text-slate-400" />
              <h2 className="text-lg font-bold text-slate-800">Monthly Salary</h2>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={monthlySalary || ''}
                onChange={(e) => setMonthlySalary(parseFloat(e.target.value) || 0)}
                placeholder="Enter monthly salary"
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              <button
                onClick={handleSaveSalary}
                className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all"
              >
                Save
              </button>
            </div>
            {monthlySalary > 0 && (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Monthly Expenses:</span>
                  <span className="font-bold text-slate-800">${totalExpenses.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-slate-600">Total Savings:</span>
                  <span className="font-bold text-emerald-600">${totalSavings.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-slate-600">Remaining to Save:</span>
                  <span className="font-bold text-amber-600">${remainingSalary.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Add Entry Button */}
          {!isAddingEntry && (
            <button
              onClick={() => setIsAddingEntry(true)}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all"
            >
              <Plus size={20} />
              <span>Add Daily Savings</span>
            </button>
          )}

          {/* Add Entry Form */}
          {isAddingEntry && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Add Savings Entry</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={newEntryDate}
                    onChange={(e) => setNewEntryDate(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Amount</label>
                  <input
                    type="number"
                    value={newEntryAmount}
                    onChange={(e) => setNewEntryAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Description (Optional)</label>
                  <input
                    type="text"
                    value={newEntryDescription}
                    onChange={(e) => setNewEntryDescription(e.target.value)}
                    placeholder="Add a note"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddEntry}
                    className="flex-1 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all"
                  >
                    Save Entry
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingEntry(false);
                      setNewEntryAmount('');
                      setNewEntryDescription('');
                    }}
                    className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Daily Savings Cards */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Daily Savings</h2>
            {Object.keys(entriesByDay).length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                <PiggyBank size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">No savings entries yet. Start tracking your savings!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(entriesByDay)
                  .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                  .map(([day, entries]) => {
                    const dayTotal = entries.reduce((sum, e) => sum + e.amount, 0);
                    return (
                      <div key={day} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 px-6 py-4 border-b border-slate-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-slate-800">{formatDate(day)}</h3>
                              <p className="text-xs text-slate-500">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-emerald-600">${dayTotal.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          {entries.map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                              <div className="flex-1">
                                <p className="font-bold text-slate-800">${entry.amount.toFixed(2)}</p>
                                {entry.description && (
                                  <p className="text-xs text-slate-500 mt-1">{entry.description}</p>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Calculator Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
            <div className="flex items-center space-x-2 mb-4">
              <Calculator size={20} className="text-slate-400" />
              <h2 className="text-lg font-bold text-slate-800">Calculator</h2>
            </div>
            
            {/* Display */}
            <div className="bg-slate-900 rounded-xl p-4 mb-4">
              <div className="text-right">
                <p className="text-3xl font-mono font-bold text-emerald-400 overflow-x-auto">
                  {calcDisplay}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={handleCalcClear}
                className="col-span-2 px-4 py-3 bg-rose-500 text-white font-bold rounded-lg hover:bg-rose-600 transition-all"
              >
                Clear
              </button>
              <button
                onClick={() => handleCalcOperation('/')}
                className="px-4 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-all"
              >
                ÷
              </button>
              <button
                onClick={() => handleCalcOperation('*')}
                className="px-4 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-all"
              >
                ×
              </button>

              {[7, 8, 9, '-'].map((val) => (
                <button
                  key={val}
                  onClick={() => typeof val === 'number' ? handleCalcInput(String(val)) : handleCalcOperation(val)}
                  className={`px-4 py-3 font-bold rounded-lg transition-all ${
                    typeof val === 'number'
                      ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {val}
                </button>
              ))}

              {[4, 5, 6, '+'].map((val) => (
                <button
                  key={val}
                  onClick={() => typeof val === 'number' ? handleCalcInput(String(val)) : handleCalcOperation(val)}
                  className={`px-4 py-3 font-bold rounded-lg transition-all ${
                    typeof val === 'number'
                      ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {val}
                </button>
              ))}

              <button
                onClick={() => handleCalcInput('1')}
                className="px-4 py-3 bg-slate-100 text-slate-800 font-bold rounded-lg hover:bg-slate-200 transition-all"
              >
                1
              </button>
              <button
                onClick={() => handleCalcInput('2')}
                className="px-4 py-3 bg-slate-100 text-slate-800 font-bold rounded-lg hover:bg-slate-200 transition-all"
              >
                2
              </button>
              <button
                onClick={() => handleCalcInput('3')}
                className="px-4 py-3 bg-slate-100 text-slate-800 font-bold rounded-lg hover:bg-slate-200 transition-all"
              >
                3
              </button>
              <button
                onClick={handleCalcEquals}
                className="row-span-2 px-4 py-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-all"
              >
                =
              </button>

              <button
                onClick={() => handleCalcInput('0')}
                className="col-span-2 px-4 py-3 bg-slate-100 text-slate-800 font-bold rounded-lg hover:bg-slate-200 transition-all"
              >
                0
              </button>
              <button
                onClick={() => handleCalcInput('.')}
                className="px-4 py-3 bg-slate-100 text-slate-800 font-bold rounded-lg hover:bg-slate-200 transition-all"
              >
                .
              </button>
            </div>

            <button
              onClick={useCalcValue}
              className="w-full mt-4 px-4 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-all"
            >
              Use in Amount Field
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsProgressPage;

