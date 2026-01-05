import React, { useState } from 'react';
import { signInWithPassword, signUpNewUser, signInWithGoogle } from '../services/supabase';
import { Logo } from '../components/Header';

const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
        if (isSignUp) {
            const { error } = await signUpNewUser(email, password);
            if (error) throw error;
            setMessage('Account created! Please verify your email.');
            setIsSignUp(false);
        } else {
            const { error } = await signInWithPassword(email, password);
            if (error) throw error;
        }
    } catch (err: any) {
        setError(err.error_description || err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
        const { error } = await signInWithGoogle();
        if (error) throw error;
    } catch (err: any) {
        setError(err.error_description || err.message || "Google Login failed.");
        setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
      setEmail('demo@example.com');
      setPassword('demo123');
      setIsSignUp(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
            <div className="inline-flex bg-brand-dark p-6 rounded-2xl shadow-xl border border-white/10 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-logo-mint/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <Logo size={64} />
            </div>
          <h1 className="text-3xl font-black text-brand-dark mt-6 tracking-tight">GB Finance 2.0</h1>
          <p className="text-brand-secondary font-medium mt-1 uppercase tracking-widest text-[10px]">Professional Sales & Expense Hub</p>
        </div>
        
        <form onSubmit={handleAuthAction} className="bg-white p-8 rounded-xl shadow-xl border border-gray-200 space-y-6">
          
          {error && <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-md text-xs font-bold">{error}</div>}
          {message && <div className="bg-green-50 text-green-700 border border-green-200 p-3 rounded-md text-xs font-bold">{message}</div>}

          <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Work Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-brand-dark rounded-md p-3 focus:ring-2 focus:ring-brand-primary outline-none transition-all font-medium"
                  placeholder="you@company.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="password"className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Secure Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-brand-dark rounded-md p-3 focus:ring-2 focus:ring-brand-primary outline-none transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
          </div>

          <div className="space-y-3">
            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-dark text-white font-black py-4 rounded-md hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:bg-gray-400 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
            >
                {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>

            <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] font-black uppercase tracking-widest">Security Layer</span>
                <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white text-gray-700 border border-gray-200 font-bold py-3.5 rounded-md hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-3 text-sm"
            >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
            </button>
          </div>

          {!isSignUp && (
             <div className="pt-2 border-t border-gray-100">
                <button 
                    type="button"
                    onClick={fillDemoCredentials}
                    className="w-full bg-slate-50 text-brand-dark font-bold py-2.5 rounded-md hover:bg-slate-100 transition-colors text-xs border border-slate-200 uppercase tracking-widest"
                >
                    Try Demo Version
                </button>
             </div>
          )}
        </form>

        <div className="mt-8 text-center">
            <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }} className="text-sm font-bold text-brand-dark hover:text-brand-primary-hover transition-colors tracking-tight">
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one now"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;