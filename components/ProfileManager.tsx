
import React, { useState } from 'react';
import { updateUserPassword } from '../services/supabase';

const ProfileManager: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password.length < 6) {
        setMessage({ type: 'error', text: 'Auth Protocol: Min 6 chars required.' });
        return;
    }

    if (password !== confirmPassword) {
        setMessage({ type: 'error', text: 'Auth Protocol: Mismatched keys.' });
        return;
    }

    setIsLoading(true);
    try {
        const { error } = await updateUserPassword(password);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Identity Protocol: Credentials Synchronized.' });
        setPassword('');
        setConfirmPassword('');
    } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Identity Update Failed.' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
            {message.text}
        </div>
      )}

      <form onSubmit={handleUpdate} className="flex flex-col sm:flex-row gap-2">
        <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder-slate-400"
            placeholder="New Passphrase"
        />
        <input 
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder-slate-400"
            placeholder="Confirm Passphrase"
        />
        <button 
            type="submit" 
            disabled={isLoading || !password}
            className="px-6 py-3 bg-brand-dark dark:bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 transition-all active:scale-95"
        >
            {isLoading ? 'Syncing...' : 'Update'}
        </button>
      </form>
    </div>
  );
};

export default ProfileManager;
