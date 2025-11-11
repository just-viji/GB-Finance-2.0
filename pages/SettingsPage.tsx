import React from 'react';
import CategoryManager from '../components/CategoryManager';
import GoogleSheetSync from '../components/GoogleSheetSync';

interface SettingsPageProps {
  categories: string[];
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
  onClearAllData: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ categories, onAddCategory, onDeleteCategory, onClearAllData }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-brand-dark">Settings</h2>

      <CategoryManager
        categories={categories}
        onAddCategory={onAddCategory}
        onDeleteCategory={onDeleteCategory}
      />
      
      <GoogleSheetSync />

      <div className="bg-white p-6 rounded-xl shadow-md border border-red-200">
        <h3 className="text-xl font-semibold text-red-600">Danger Zone</h3>
        <p className="text-brand-secondary mt-2 mb-4">
          Clearing all data will permanently delete all your transactions and custom categories. The app will be reset to its initial state. This action cannot be undone.
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