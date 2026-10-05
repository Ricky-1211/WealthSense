
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Investment, InvestmentType } from '../types';
import { TrendingUp, TrendingDown, Plus, PieChart, DollarSign, Percent, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

type TabType = 'portfolio' | 'holdings' | 'performance';

const InvestmentsPage: React.FC = () => {
  const { investments } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>('portfolio');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const investmentList = investments?.investments || [];

  const portfolioStats = useMemo(() => {
    const totalInvested = investmentList.reduce((acc, inv) => acc + inv.investedAmount, 0);
    const totalCurrentValue = investmentList.reduce((acc, inv) => acc + inv.currentValue, 0);
    const totalProfitLoss = totalCurrentValue - totalInvested;
    const totalReturns = totalInvested > 0 ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 : 0;

    const allocation = investmentList.reduce((acc, inv) => {
      acc[inv.type] = (acc[inv.type] || 0) + inv.currentValue;
      return acc;
    }, {} as Record<InvestmentType, number>);

    return {
      totalInvested,
      totalCurrentValue,
      totalProfitLoss,
      totalReturns,
      allocation
    };
  }, [investmentList]);

  const typeLabels: Record<InvestmentType, string> = {
    stock: 'Stocks',
    mutual_fund: 'Mutual Funds',
    etf: 'ETFs',
    sip: 'SIP',
    gold: 'Gold',
    crypto: 'Crypto'
  };

  const typeColors: Record<InvestmentType, string> = {
    stock: 'bg-blue-500',
    mutual_fund: 'bg-purple-500',
    etf: 'bg-green-500',
    sip: 'bg-orange-500',
    gold: 'bg-yellow-500',
    crypto: 'bg-pink-500'
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Investments</h1>
          <p className="text-slate-500 mt-1">Track your portfolio performance and returns.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95"
        >
          <Plus size={18} />
          <span>Add Investment</span>
        </button>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Invested</span>
            <DollarSign size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-800">${portfolioStats.totalInvested.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Current Value</span>
            <PieChart size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-800">${portfolioStats.totalCurrentValue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Profit/Loss</span>
            {portfolioStats.totalProfitLoss >= 0 ? <TrendingUp size={16} className="text-emerald-500" /> : <TrendingDown size={16} className="text-rose-500" />}
          </div>
          <p className={`text-2xl font-black ${portfolioStats.totalProfitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ${portfolioStats.totalProfitLoss.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Returns</span>
            <Percent size={16} className="text-slate-400" />
          </div>
          <p className={`text-2xl font-black ${portfolioStats.totalReturns >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {portfolioStats.totalReturns.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
        {[
          { id: 'portfolio' as TabType, label: 'Portfolio' },
          { id: 'holdings' as TabType, label: 'Holdings' },
          { id: 'performance' as TabType, label: 'Performance' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {investmentList.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
              <PieChart size={48} className="text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-800 mb-2">No Investments Yet</h3>
              <p className="text-slate-500 mb-4">Start tracking your investments by adding your first one.</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold transition-all"
              >
                <Plus size={18} />
                <span>Add Investment</span>
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Portfolio Allocation</h3>
                <div className="space-y-3">
                  {Object.entries(portfolioStats.allocation).map(([type, value]) => {
                const percent = portfolioStats.totalCurrentValue > 0 ? ((value as number) / portfolioStats.totalCurrentValue) * 100 : 0;
                return (
                  <div key={type}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-slate-600">{typeLabels[type as InvestmentType]}</span>
                      <span className="text-sm font-bold text-slate-800">${(value as number).toLocaleString()} ({percent.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${typeColors[type as InvestmentType]} rounded-full transition-all`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Investment Summary</h3>
            <div className="space-y-4">
              {investmentList.slice(0, 5).map(inv => {
                const profitLoss = inv.currentValue - inv.investedAmount;
                const returns = ((inv.currentValue - inv.investedAmount) / inv.investedAmount) * 100;
                return (
                  <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${typeColors[inv.type]} rounded-lg flex items-center justify-center text-white`}>
                        <PieChart size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{inv.name}</p>
                        <p className="text-xs text-slate-500">{inv.symbol || typeLabels[inv.type]}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">${inv.currentValue.toLocaleString()}</p>
                      <p className={`text-xs font-bold ${returns >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {returns >= 0 ? '+' : ''}{returns.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
            </>
          )}
        </div>
      )}

      {/* Holdings Tab */}
      {activeTab === 'holdings' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {investmentList.length === 0 ? (
            <div className="p-12 text-center">
              <PieChart size={48} className="text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-800 mb-2">No Holdings Yet</h3>
              <p className="text-slate-500 mb-4">Add your first investment to start tracking.</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold transition-all"
              >
                <Plus size={18} />
                <span>Add Investment</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Investment</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Type</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase">Units</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase">Invested</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase">Current</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase">P/L</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase">Returns</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase">XIRR</th>
                  </tr>
                </thead>
                <tbody>
                  {investmentList.map(inv => {
                  const profitLoss = inv.currentValue - inv.investedAmount;
                  const returns = ((inv.currentValue - inv.investedAmount) / inv.investedAmount) * 100;
                  return (
                    <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-800">{inv.name}</p>
                          <p className="text-xs text-slate-500">{inv.symbol || '-'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md capitalize">
                          {typeLabels[inv.type]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-800">{inv.units}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-800">${inv.investedAmount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800">${inv.currentValue.toLocaleString()}</td>
                      <td className={`px-6 py-4 text-right font-bold ${profitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ${profitLoss.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${returns >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {returns >= 0 ? '+' : ''}{returns.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800">
                        {inv.xirr ? inv.xirr.toFixed(2) + '%' : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {investmentList.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
              <TrendingUp size={48} className="text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-800 mb-2">No Performance Data</h3>
              <p className="text-slate-500 mb-4">Add investments to see performance analysis.</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold transition-all"
              >
                <Plus size={18} />
                <span>Add Investment</span>
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Performance by Type</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.keys(typeLabels).map(type => {
                const typeInvestments = investmentList.filter(inv => inv.type === type as InvestmentType);
                if (typeInvestments.length === 0) return null;
                const totalInvested = typeInvestments.reduce((acc, inv) => acc + inv.investedAmount, 0);
                const totalCurrent = typeInvestments.reduce((acc, inv) => acc + inv.currentValue, 0);
                const returns = ((totalCurrent - totalInvested) / totalInvested) * 100;
                
                return (
                  <div key={type} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-8 h-8 ${typeColors[type as InvestmentType]} rounded-lg flex items-center justify-center text-white`}>
                        <PieChart size={16} />
                      </div>
                      <span className="font-bold text-slate-800 text-sm">{typeLabels[type as InvestmentType]}</span>
                    </div>
                    <p className="text-lg font-black text-slate-800">${totalCurrent.toLocaleString()}</p>
                    <p className={`text-xs font-bold ${returns >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {returns >= 0 ? <ArrowUpRight size={12} className="inline mr-1" /> : <ArrowDownRight size={12} className="inline mr-1" />}
                      {returns >= 0 ? '+' : ''}{returns.toFixed(2)}%
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-2xl border border-emerald-100">
            <h4 className="font-bold text-slate-800 mb-2">💡 Investment Tips</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Diversify your portfolio across different asset classes</li>
              <li>• Review your investments quarterly and rebalance if needed</li>
              <li>• Consider SIP for disciplined investing in mutual funds</li>
              <li>• Track XIRR to measure actual returns on your investments</li>
            </ul>
          </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default InvestmentsPage;
