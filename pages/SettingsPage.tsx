import React from 'react';
import CategoryManager from '../components/CategoryManager';

interface SettingsPageProps {
    onResetData: () => void;
    categories: string[];
    onAddCategory: (category: string) => void;
    onDeleteCategory: (category: string) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
    onResetData,
    categories,
    onAddCategory,
    onDeleteCategory,
}) => {
    // Exclude 'Sale' category from being managed by the user as it's a special system category
    const userManagedCategories = categories.filter(c => c !== 'Sale');

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <CategoryManager 
                categories={userManagedCategories}
                onAddCategory={onAddCategory}
                onDeleteCategory={onDeleteCategory}
            />
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-brand-dark">Data Management</h2>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
                    <h3 className="font-semibold text-yellow-800">Warning</h3>
                    <p className="text-sm text-yellow-700">Resetting data will permanently delete all your transactions and custom categories. This action cannot be undone.</p>
                </div>
                 <button onClick={onResetData} className="w-full bg-brand-accent text-white font-semibold py-2 px-4 rounded-md hover:bg-red-600 transition-colors">Reset All Data</button>
            </div>
        </div>
    );
};

export default SettingsPage;
