import React from 'react';
import { Session } from '@supabase/supabase-js';
import CategoryManager from '../components/CategoryManager';

interface SettingsPageProps {
    session: Session | null;
    onSignOut?: () => void;
    categories: string[];
    onAddCategory: (category: string) => void;
    onDeleteCategory: (category: string) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
    session,
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
                    {session?.user?.email && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                            <p className="text-sm text-brand-secondary">You are signed in as:</p>
                            <p className="font-semibold text-brand-dark truncate">{session.user.email}</p>
                        </div>
                    )}
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