import React from 'react';
import CategoryManager from '../components/CategoryManager';

interface SettingsPageProps {
    onSignOut?: () => void;
    categories: string[];
    onAddCategory: (category: string) => void;
    onDeleteCategory: (category: string) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
    onSignOut,
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
            {onSignOut && (
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-brand-dark">Account</h2>
                    <button 
                        onClick={onSignOut} 
                        className="w-full bg-brand-secondary text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-600 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
