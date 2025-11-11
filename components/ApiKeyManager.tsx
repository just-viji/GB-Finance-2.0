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
      setMaskedKey(key.slice(0, 4) + '...'.padEnd(20, '*') + key.slice(-4));
    }
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      setGeminiApiKey(apiKey.trim());
      setIsKeySet(true);
      setMaskedKey(apiKey.trim().slice(0, 4) + '...'.padEnd(20, '*') + apiKey.trim().slice(-4));
      setApiKey('');
      alert('API Key saved successfully!');
    }
  };

  const handleRemove = () => {
    removeGeminiApiKey();
    setIsKeySet(false);
    alert('API Key removed.');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-xl font-semibold text-brand-dark mb-2">Gemini AI Configuration</h3>
      <p className="text-sm text-brand-secondary mb-4">
        To use the AI bill scanning feature, you need to provide your own Google Gemini API key. 
        You can get a free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-primary underline">Google AI Studio</a>.
      </p>

      {isKeySet ? (
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
          <p className="text-sm font-mono text-brand-dark">{maskedKey}</p>
          <button
            onClick={handleRemove}
            className="px-4 py-2 text-sm rounded-md font-semibold bg-red-100 text-red-700 hover:bg-red-200"
          >
            Remove Key
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste your Gemini API key here"
            className="flex-grow w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
            aria-label="Gemini API Key"
          />
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-brand-primary text-white rounded-md font-semibold hover:bg-brand-primary-hover disabled:bg-gray-400"
            disabled={!apiKey.trim()}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManager;
