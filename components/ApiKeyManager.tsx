
import React, { useState, useEffect } from 'react';
import { getGeminiApiKey, setGeminiApiKey, removeGeminiApiKey } from '../services/apiKeyService';

const ApiKeyManager: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [isKeySet, setIsKeySet] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');

  useEffect(() => {
    const key = getGeminiApiKey();
    if (key) {
      setIsKeySet(true);
      setMaskedKey(key.slice(0, 4) + '...'.padEnd(16, '*') + key.slice(-4));
    }
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      setGeminiApiKey(apiKey.trim());
      setIsKeySet(true);
      setMaskedKey(apiKey.trim().slice(0, 4) + '...'.padEnd(16, '*') + apiKey.trim().slice(-4));
      setApiKey('');
    }
  };

  const handleRemove = () => {
    removeGeminiApiKey();
    setIsKeySet(false);
  };

  return (
    <div className="space-y-4">
      {isKeySet ? (
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-3 rounded-xl">
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
             </div>
             <p className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 truncate tracking-widest">{maskedKey}</p>
          </div>
          <button
            onClick={handleRemove}
            className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            Revoke
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Vertex/Gemini API Provision Key"
            className="flex-grow bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder-slate-400"
          />
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="px-6 py-3 bg-brand-dark dark:bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 transition-all active:scale-95 shadow-sm"
          >
            Link
          </button>
        </div>
      )}
      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
        Credentials sourced from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-primary border-b border-brand-primary/30">Google Cloud Console</a>
      </p>
    </div>
  );
};

export default ApiKeyManager;
