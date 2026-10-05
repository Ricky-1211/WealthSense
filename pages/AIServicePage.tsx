
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { getFinancialAdvice, askFinancialQuery } from '../services/geminiService';
import { Sparkles, BrainCircuit, ShieldCheck, ChevronRight, Loader2, Target, PiggyBank, Send, MessageSquare, TrendingUp, AlertTriangle, Calendar, DollarSign, ArrowUp, ArrowDown } from 'lucide-react';

type QueryType = 'general' | 'spending_analysis' | 'budget_recommendation' | 'savings_recommendation' | 'subscription_analysis' | 'cashflow_forecast' | 'goal_forecast';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  queryType?: QueryType;
  timestamp: Date;
}

const AIServicePage: React.FC = () => {
  const { transactions, budgets, savings } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<any>(null);
  const [chatMode, setChatMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQueries = [
    { icon: <TrendingUp size={16} />, label: 'Where did my money go?', query: 'Where did my money go this month?' },
    { icon: <DollarSign size={16} />, label: 'Spending by category', query: 'How much did I spend on food this month?' },
    { icon: <AlertTriangle size={16} />, label: 'Anomaly detection', query: 'Show my biggest unnecessary expenses.' },
    { icon: <Calendar size={16} />, label: 'Monthly summary', query: 'Give me a monthly financial summary.' },
    { icon: <Target size={16} />, label: 'Budget advice', query: 'Can I afford ₹20,000 this month?' },
    { icon: <ArrowUp size={16} />, label: 'Savings tips', query: 'How can I save more money?' },
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await getFinancialAdvice(transactions, budgets);
    setAdvice(result);
    setLoading(false);
  };

  const handleSendMessage = async (userQuery?: string) => {
    const queryText = userQuery || query;
    if (!queryText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: queryText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsTyping(true);

    try {
      const response = await askFinancialQuery(queryText, transactions, budgets, savings);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  const handleQuickQuery = (quickQuery: string) => {
    setQuery(quickQuery);
    handleSendMessage(quickQuery);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in zoom-in-95 duration-500">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold animate-bounce">
          <Sparkles size={16} />
          <span>Powered by Gemini</span>
        </div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">AI Financial Copilot</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Your personal financial assistant. Ask questions, get insights, and make smarter money decisions.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setChatMode(false)}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
              !chatMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Analysis
          </button>
          <button
            onClick={() => setChatMode(true)}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
              chatMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Chat Assistant
          </button>
        </div>
      </div>

      {/* Analysis Mode */}
      {!chatMode && (
        <>
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
                <span>Run Financial Analysis</span>
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
        </>
      )}

      {/* Chat Mode */}
      {chatMode && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
            <div className="flex items-center space-x-3">
              <MessageSquare size={24} />
              <div>
                <h2 className="text-xl font-bold">Financial Assistant</h2>
                <p className="text-emerald-100 text-sm">Ask me anything about your finances</p>
              </div>
            </div>
          </div>

          {/* Quick Queries */}
          {messages.length === 0 && (
            <div className="p-6 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-500 uppercase mb-4">Quick Questions</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quickQueries.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuery(item.query)}
                    className="flex items-center space-x-3 p-4 bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-200 hover:border-emerald-200 transition-all text-left"
                  >
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <BrainCircuit size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Start a conversation with your financial assistant</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-slate-800 border border-slate-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex space-x-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about your finances..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!query.trim() || isTyping}
                className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIServicePage;
