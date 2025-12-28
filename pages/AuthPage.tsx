
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { TrendingUp, Mail, Lock, User, ArrowRight, Loader2, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';

const AuthPage: React.FC = () => {
  const { login, register } = useAppContext();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfigHint, setShowConfigHint] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowConfigHint(false);
    setIsLoading(true);
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password);
      }
    } catch (err: any) {
      // Extract error code and message from various possible error structures
      const errorCode = err?.code || err?.error?.code || '';
      const errorMessage = err?.message || err?.error?.message || err?.toString() || 'Authentication failed';
      
      let message = errorMessage;
      
      // Handle specific Firebase configuration error - Email/Password not enabled
      // Check multiple possible error codes and message patterns
      const isConfigError = 
        errorCode === 'auth/operation-not-allowed' ||
        errorCode === 'auth/configuration-not-found' ||
        errorCode === 'auth/api-key-not-valid' ||
        errorMessage.toLowerCase().includes('operation-not-allowed') ||
        errorMessage.toLowerCase().includes('configuration-not-found') ||
        errorMessage.toLowerCase().includes('auth method is not enabled') ||
        errorMessage.toLowerCase().includes('sign-in method') ||
        errorCode.includes('configuration');
      
      if (isConfigError) {
        message = 'Authentication service is not enabled in Firebase.';
        setShowConfigHint(true);
      } else if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
        message = 'Invalid email or password. Please try again.';
      } else if (errorCode === 'auth/email-already-in-use') {
        message = 'An account already exists with this email.';
      } else if (errorCode === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (errorCode === 'auth/invalid-email') {
        message = 'Invalid email address format.';
      } else if (errorCode === 'auth/network-request-failed') {
        message = 'Network error. Please check your connection.';
      } else {
        // Only log unhandled errors to console
        console.error("Unhandled auth error:", { code: errorCode, message: errorMessage, error: err });
      }
      
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-3 md:p-4 safe-area-inset-top safe-area-inset-bottom">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col">
        <div className="p-6 md:p-8 text-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4">
              <TrendingUp size={24} className="md:w-8 md:h-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">WealthSense</h1>
            <p className="text-emerald-50 opacity-90 text-xs md:text-sm mt-1">Master your money with AI intelligence</p>
          </div>
          <Sparkles className="absolute -bottom-6 -right-6 text-white/10 w-24 h-24 md:w-32 md:h-32" />
        </div>

        <div className="p-4 md:p-6 lg:p-8">
          <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl mb-6 md:mb-8">
            <button 
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white dark:bg-slate-600 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}
            >
              Login
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white dark:bg-slate-600 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            {error && (
              <div className="p-3 md:p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-800 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start space-x-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <div className="space-y-2 flex-1 min-w-0">
                    <p className="text-xs font-bold leading-tight">{error}</p>
                    {showConfigHint && (
                      <div className="bg-white/50 dark:bg-slate-800/50 p-2 md:p-3 rounded-lg border border-rose-200 dark:border-rose-800">
                        <p className="text-[10px] font-medium leading-relaxed mb-2">
                          To fix this: Go to Firebase Console {'>'} Authentication {'>'} Sign-in method, and enable "Email/Password".
                        </p>
                        <a 
                          href="https://console.firebase.google.com/project/wealthsense-9c257/authentication/providers" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-[10px] font-black text-rose-700 dark:text-rose-300 hover:underline"
                        >
                          Open Console <ExternalLink size={10} className="ml-1" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 ml-1 tracking-widest">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
                  <input 
                    type="text" 
                    required
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 md:py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 ml-1 tracking-widest">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="alex@example.com"
                  className="w-full pl-10 pr-4 py-2.5 md:py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 ml-1 tracking-widest">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 md:py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-base md:text-lg shadow-xl shadow-emerald-100 dark:shadow-emerald-900/30 hover:bg-emerald-600 transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-70"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin md:w-6 md:h-6" /> : (
                <>
                  <span>{isLogin ? 'Enter Dashboard' : 'Create Account'}</span>
                  <ArrowRight size={18} className="md:w-5 md:h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 md:mt-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium leading-relaxed px-2">
            By continuing, you agree to WealthSense's <br/>
            <span className="text-slate-800 dark:text-slate-200 font-bold hover:underline cursor-pointer">Terms of Service</span> and <span className="text-slate-800 dark:text-slate-200 font-bold hover:underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
