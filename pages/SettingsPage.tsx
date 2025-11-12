import React from 'react';
import CategoryManager from '../components/CategoryManager';
import GoogleSheetSync from '../components/GoogleSheetSync';
import ApiKeyManager from '../components/ApiKeyManager';
import { exportTransactionsToCSV } from '../utils/transactionUtils';
import { Transaction } from '../types';

interface SettingsPageProps {
  transactions: Transaction[];
  categories: string[];
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
  onClearAllData: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onLogout: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ 
  transactions,
  categories, 
  onAddCategory, 
  onDeleteCategory, 
  onClearAllData,
  onConnect,
  onDisconnect,
  onLogout
}) => {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-brand-dark">Settings</h2>

      <GoogleSheetSync onConnect={onConnect} onDisconnect={onDisconnect} />
      
      <ApiKeyManager />

      <CategoryManager
        categories={categories}
        onAddCategory={onAddCategory}
        onDeleteCategory={onDeleteCategory}
      />
      
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-semibold text-brand-dark">Data Export</h3>
        <p className="text-brand-secondary mt-2 mb-4">
          Export all your transaction data to a CSV file. The file will be sorted by date and contain detailed information for each line item.
        </p>
        <button
          onClick={() => exportTransactionsToCSV(transactions)}
          className="px-4 py-2 text-sm rounded-md font-semibold bg-brand-primary text-white hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Export Transactions (CSV)
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-semibold text-brand-dark">Account</h3>
         <p className="text-brand-secondary mt-2 mb-4">
          You are currently logged in as <span className="font-semibold text-brand-dark">admin</span>.
        </p>
        <button
          onClick={onLogout}
          className="px-4 py-2 text-sm rounded-md font-semibold bg-brand-secondary/10 text-brand-secondary hover:bg-brand-secondary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
        >
          Logout
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border border-red-200">
        <h3 className="text-xl font-semibold text-red-600">Danger Zone</h3>
        <p className="text-brand-secondary mt-2 mb-4">
          Clearing all data will permanently delete all your transactions and custom categories from the Google Sheet. The app will be reset to its initial state. This action cannot be undone.
        </p>
        <button
          onClick={onClearAllData}
          className="px-4 py-2 text-sm rounded-md font-semibold bg-brand-accent text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Clear All App Data
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;