import React from 'react';
import GoogleSheetSync from '../components/GoogleSheetSync';
import { Transaction } from '../types';

interface SettingsPageProps {
  transactions: Transaction[];
  onLogout: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ transactions, onLogout }) => {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-brand-dark">Settings</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold text-brand-dark mb-4">Actions</h2>
        <button 
          onClick={onLogout}
          className="w-full max-w-xs bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold text-brand-dark mb-4">Data Sync</h2>
        <GoogleSheetSync transactions={transactions} />
      </div>
    </div>
  );
};

export default SettingsPage;
