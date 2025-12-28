
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { getFinancialAdvice } from '../services/geminiService';
import { Sparkles, BrainCircuit, ShieldCheck, ChevronRight, Loader2, Target, PiggyBank } from 'lucide-react';

const AIServicePage: React.FC = () => {
  const { transactions, budgets } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<any>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await getFinancialAdvice(transactions, budgets);
    setAdvice(result);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold animate-bounce">
          <Sparkles size={16} />
          <span>Powered by Gemini</span>
        </div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Financial AI Insights</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Our advanced AI analyzes your spending patterns to provide personalized financial coaching and savings opportunities.
        </p>
      </div>

      {!advice && !loading && (
        <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
            <BrainCircuit size={40} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Ready for Analysis?</h3>
            <p className="text-slate-500 mt-2">I will securely process your data to help you save more money.</p>
          </div>
          <button
            onClick={handleAnalyze}
            className="group relative flex items-center space-x-2 bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-600 transition-all hover:-translate-y-1 active:scale-95"
          >
            <span>Ask AI Assistant</span>
            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-6 shadow-xl shadow-slate-100">
          <Loader2 size={64} className="text-emerald-500 animate-spin" />
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-800">Processing Your Data...</h3>
            <p className="text-slate-500 italic animate-pulse">Running advanced algorithms on your spending history</p>
          </div>
        </div>
      )}

      {advice && !loading && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-3xl text-white shadow-2xl shadow-emerald-200 relative overflow-hidden">
               <div className="relative z-10">
                <p className="text-emerald-100 font-bold uppercase text-xs tracking-widest mb-2">Financial Health Score</p>
                <h2 className="text-7xl font-black">{advice.healthScore}%</h2>
                <div className="mt-6 h-2 w-full bg-white/20 rounded-full">
                  <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${advice.healthScore}%` }} />
                </div>
                <p className="mt-4 text-emerald-50 opacity-90 leading-relaxed italic">
                  "You're doing better than 75% of similar users this month."
                </p>
              </div>
              <Sparkles className="absolute -bottom-6 -right-6 text-white/10 w-48 h-48" />
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-slate-400 mb-2">
                  <Target size={18} />
                  <p className="font-bold uppercase text-xs tracking-widest">Main Opportunity</p>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 leading-tight">
                  High spending detected in <span className="text-emerald-500">{advice.topSpendingCategory}</span>
                </h3>
              </div>
              <div className="mt-8 flex items-center space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <PiggyBank className="text-emerald-500" />
                <p className="text-sm text-slate-600">
                  <span className="font-bold text-slate-800">Pro Tip:</span> Try setting a lower budget for this category next month.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Coach's Summary</h3>
            </div>
            <p className="text-slate-600 leading-relaxed text-lg">
              {advice.summary}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              {advice.savingsAdvice.map((item: string, i: number) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start space-x-3">
                  <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-slate-600 text-sm font-medium">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setAdvice(null)}
            className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
          >
            Clear and Re-run Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default AIServicePage;
