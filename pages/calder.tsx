import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Calendar, Clock, DollarSign, Save, X } from 'lucide-react';
import { api } from '../services/api';

const Calder: React.FC = () => {
  const { transactions } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isNotepadOpen, setIsNotepadOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load notes for the selected date
  const loadNotes = useCallback(async () => {
    try {
      const dateNotes = await api.getNote(selectedDate);
      setNotes(prev => ({ ...prev, [selectedDate]: dateNotes || '' }));
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const saveNote = async () => {
    try {
      await api.saveNote(selectedDate, notes[selectedDate] || '');
      alert('Note saved successfully!');
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('Failed to save note');
    }
  };

  // Get days in current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Calculate spending for a specific date
  const getDaySpending = (date: Date | null): { income: number; expense: number } => {
    if (!date) return { income: 0, expense: 0 };
    
    const dateStr = date.toISOString().split('T')[0];
    const dayTransactions = transactions.filter(t => t.date === dateStr);
    
    return {
      income: dayTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
      expense: dayTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)
    };
  };

  const days = getDaysInMonth(currentDate);
  const selectedDaySpending = useMemo(() => {
    const selected = new Date(selectedDate);
    return getDaySpending(selected);
  }, [selectedDate, transactions]);

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date | null) => {
    if (!date) return false;
    return date.toISOString().split('T')[0] === selectedDate;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header with Date and Time */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Calendar size={24} />
              <h1 className="text-3xl font-bold">Calendar View</h1>
            </div>
            <p className="text-emerald-50 text-lg">{formatDate(currentTime)}</p>
          </div>
          <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
            <Clock size={20} />
            <span className="text-2xl font-mono font-bold">{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Section */}
        <div className={`flex-1 transition-all duration-300 ${isNotepadOpen ? 'lg:w-2/3' : 'lg:w-full'}`}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => changeMonth('prev')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-slate-700 transition-colors"
              >
                ← Prev
              </button>
              <h2 className="text-2xl font-bold text-slate-800">{monthName}</h2>
              <button
                onClick={() => changeMonth('next')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold text-slate-700 transition-colors"
              >
                Next →
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map(day => (
                <div key={day} className="text-center font-bold text-slate-600 py-2 text-sm">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const spending = getDaySpending(date);
                const dateStr = date.toISOString().split('T')[0];
                const netAmount = spending.income - spending.expense;
                const hasTransactions = spending.income > 0 || spending.expense > 0;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`aspect-square p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                      isSelected(date)
                        ? 'border-emerald-500 bg-emerald-50 shadow-md'
                        : isToday(date)
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col h-full">
                      <span className={`text-sm font-bold mb-1 ${
                        isSelected(date) ? 'text-emerald-700' : isToday(date) ? 'text-blue-700' : 'text-slate-700'
                      }`}>
                        {date.getDate()}
                      </span>
                      {hasTransactions && (
                        <div className="flex-1 flex flex-col justify-end text-xs">
                          {spending.expense > 0 && (
                            <div className="text-red-600 font-semibold">
                              -${spending.expense.toFixed(0)}
                            </div>
                          )}
                          {spending.income > 0 && (
                            <div className="text-green-600 font-semibold">
                              +${spending.income.toFixed(0)}
                            </div>
                          )}
                          {netAmount !== 0 && (
                            <div className={`font-bold ${netAmount > 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {netAmount > 0 ? '+' : ''}${netAmount.toFixed(0)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Day Summary */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center space-x-2">
                <DollarSign size={18} />
                <span>Selected Day Summary - {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="text-green-600 text-sm font-semibold">Income</div>
                  <div className="text-green-700 text-xl font-bold">${selectedDaySpending.income.toFixed(2)}</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="text-red-600 text-sm font-semibold">Expense</div>
                  <div className="text-red-700 text-xl font-bold">${selectedDaySpending.expense.toFixed(2)}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 col-span-2">
                  <div className="text-blue-600 text-sm font-semibold">Net Amount</div>
                  <div className={`text-xl font-bold ${(selectedDaySpending.income - selectedDaySpending.expense) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    ${(selectedDaySpending.income - selectedDaySpending.expense).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notepad Section */}
        <div className={`transition-all duration-300 ${isNotepadOpen ? 'lg:w-1/3' : 'lg:w-0'} overflow-hidden`}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center space-x-2">
                <span>📝</span>
                <span>Daily Notes</span>
              </h3>
              <button
                onClick={() => setIsNotepadOpen(!isNotepadOpen)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-slate-600" />
              </button>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="mb-3 text-sm text-slate-600">
                <span className="font-semibold">Date: </span>
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </div>
              <textarea
                value={notes[selectedDate] || ''}
                onChange={(e) => setNotes(prev => ({ ...prev, [selectedDate]: e.target.value }))}
                placeholder="Write your notes for this day..."
                className="flex-1 w-full p-3 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-700"
                rows={10}
              />
              <button
                onClick={saveNote}
                className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors shadow-md hover:shadow-lg"
              >
                <Save size={18} />
                <span>Save Note</span>
              </button>
            </div>
          </div>
        </div>

        {/* Toggle Notepad Button (when closed) */}
        {!isNotepadOpen && (
          <button
            onClick={() => setIsNotepadOpen(true)}
            className="fixed right-4 bottom-24 md:bottom-8 bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
            title="Open Notepad"
          >
            <span className="text-2xl">📝</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Calder;

