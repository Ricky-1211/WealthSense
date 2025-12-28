
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import BudgetsPage from './pages/BudgetsPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import AIServicePage from './pages/AIServicePage';
import AuthPage from './pages/AuthPage';
import Calder from './pages/calder';
import SavingsProgressPage from './pages/SavingsProgressPage';
import TrackingPage from './pages/TrackingPage';
import { useIsMobile } from './hooks/useIsMobile';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppContext();
  const isMobile = useIsMobile();
  
  if (!isAuthenticated) return <AuthPage />;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Navbar />
        <main className={`flex-1 overflow-y-auto ${isMobile ? 'p-3 pb-20' : 'p-4 md:p-6 lg:p-8 pb-8'} bg-slate-50 dark:bg-slate-900`}>
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/ai-insights" element={<AIServicePage />} />
            <Route path="/calendar" element={<Calder />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/savings" element={<SavingsProgressPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
