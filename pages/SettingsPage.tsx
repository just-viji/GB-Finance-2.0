
import React, { useRef, useState, useMemo } from 'react';
import CategoryManager from '../components/CategoryManager';
import ProfileManager from '../components/ProfileManager';
import ConfirmDeleteAccount from '../components/ConfirmDeleteAccount';
import { exportTransactionsToCSV } from '../utils/transactionUtils';
import { Transaction, AppRelease } from '../types';
import { getLatestRelease, isUpdateAvailable } from '../services/versionService';
import { deleteUserAccount } from '../services/supabase';
import { APP_VERSION } from '../constants';

interface SettingsPageProps {
  userEmail?: string;
  userAvatar?: string;
  transactions: Transaction[];
  categories: string[];
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
  onClearAllData: () => void;
  onLogout: () => void;
  onImportTransactions: (file: File) => void;
  onDataReload?: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
}

type SubView = 'menu' | 'account' | 'appearance' | 'categories' | 'data' | 'system' | 'about';

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="px-5 mt-6 mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
);

const SettingsPage: React.FC<SettingsPageProps> = ({ 
  userEmail,
  userAvatar,
  transactions,
  categories, 
  onAddCategory, 
  onDeleteCategory, 
  onClearAllData,
  onLogout,
  onImportTransactions,
  onDataReload,
  showToast,
  theme,
  onThemeToggle
}) => {
  const [activeSubView, setActiveSubView] = useState<SubView>('menu');
  const [searchTerm, setSearchTerm] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [latestRelease, setLatestRelease] = useState<AppRelease | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const handleImportClick = () => importInputRef.current?.click();

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImportTransactions(file);
    if (e.target) e.target.value = '';
  };

  const checkUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      const release = await getLatestRelease();
      if (release) {
        const available = isUpdateAvailable(APP_VERSION, release.version);
        setLatestRelease(release);
        setUpdateAvailable(available);
        showToast(available ? `New version v${release.version} found.` : "System is up to date.", 'success');
      }
    } catch (e) {
      showToast(`Registry check failed`, "error");
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteUserAccount();
      showToast("Account deleted.", "success");
    } catch (e: any) {
      showToast(e.message || "Operation failed.", "error");
      setIsDeletingAccount(false);
    }
  };

  const menuGroups = [
    {
      title: 'Profile',
      items: [
        { id: 'account', label: 'Security & Account', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, color: 'bg-blue-500' },
        { id: 'appearance', label: 'Display & Theme', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>, color: 'bg-indigo-500' },
      ]
    },
    {
      title: 'Configuration',
      items: [
        { id: 'categories', label: 'Categories', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h10M7 12h10m-10 5h10" /></svg>, color: 'bg-emerald-500' },
        { id: 'data', label: 'Data Management', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7M4 7l8-4 8 4M4 7l8 4 8-4m-8 4v8" /></svg>, color: 'bg-amber-500' },
      ]
    },
    {
      title: 'App',
      items: [
        { id: 'system', label: 'Software Updates', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>, color: 'bg-slate-500' },
        { id: 'about', label: 'About', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, color: 'bg-slate-400' },
      ]
    }
  ];

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return menuGroups;
    return menuGroups.map(group => ({
      ...group,
      items: group.items.filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase()))
    })).filter(group => group.items.length > 0);
  }, [searchTerm]);

  const renderActiveView = () => {
    const ViewHeader = ({ title }: { title: string }) => (
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
            <h2 className="font-bold text-slate-900 dark:text-white">{title}</h2>
        </div>
    );

    switch (activeSubView) {
      case 'account':
        return (
          <div className="animate-fade-in pb-20">
            <ViewHeader title="Account Security" />
            <div className="p-5 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="h-14 w-14 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                        {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" /> : <span className="text-xl font-bold text-slate-500">{userEmail?.[0].toUpperCase()}</span>}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{userEmail}</p>
                        <p className="text-xs text-slate-500">Standard Account</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Credentials & Security</label>
                        <ProfileManager />
                    </div>
                    <button onClick={onLogout} className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl active:scale-95 transition-all">Sign Out</button>
                    <button onClick={() => setShowDeleteAccountModal(true)} className="w-full py-3 text-red-600 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all">Delete Account</button>
                </div>
            </div>
          </div>
        );
      case 'categories':
        return (
          <div className="animate-fade-in">
            <ViewHeader title="Manage Categories" />
            <div className="p-5 space-y-6">
                <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <CategoryManager categories={categories} onAddCategory={onAddCategory} onDeleteCategory={onDeleteCategory} />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed text-center px-4">
                  Note: Categories with active transactions cannot be deleted.
                </p>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="animate-fade-in">
            <ViewHeader title="Appearance" />
            <div className="p-10 flex flex-col items-center text-center space-y-6">
                <div className={`p-6 rounded-full ${theme === 'dark' ? 'bg-indigo-900/30 text-indigo-400' : 'bg-slate-100 text-slate-600'}`}>
                    {theme === 'dark' ? <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> : <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Interface Theme</h3>
                <p className="text-sm text-slate-500">Toggle between Light and Dark mode for a comfortable viewing experience.</p>
                <button onClick={onThemeToggle} className="w-full max-w-xs py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl transition-all active:scale-95 shadow-md">
                  Switch to {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
            </div>
          </div>
        );
      case 'data':
        return (
          <div className="animate-fade-in">
            <ViewHeader title="Data & Privacy" />
            <div className="p-5 space-y-6">
                <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Export / Import</label>
                        <button onClick={onDataReload} className="text-blue-500 hover:text-blue-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <input type="file" ref={importInputRef} onChange={handleFileSelected} className="hidden" accept=".csv" />
                        <button onClick={handleImportClick} className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            <span className="text-xs font-bold">Import CSV</span>
                        </button>
                        <button onClick={() => exportTransactionsToCSV(transactions)} className="flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            <span className="text-xs font-bold">Export CSV</span>
                        </button>
                    </div>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
                    <h4 className="text-sm font-bold text-red-600 mb-1">Danger Zone</h4>
                    <p className="text-xs text-red-500 mb-4">Clears all transaction history and settings forever.</p>
                    <button onClick={onClearAllData} className="w-full py-2 bg-red-600 text-white font-bold text-xs rounded-lg shadow-sm active:scale-95 transition-all">Reset All Data</button>
                </div>
            </div>
          </div>
        );
      case 'system':
        return (
          <div className="animate-fade-in">
            <ViewHeader title="Software Update" />
            <div className="p-5 space-y-6">
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center space-y-4">
                    <div className="inline-block px-3 py-1 bg-white dark:bg-slate-900 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700">
                        Current Version: V{APP_VERSION}
                    </div>
                    <p className="text-sm text-slate-500">Stay up to date with the latest features and security improvements.</p>
                    <button onClick={checkUpdates} disabled={isCheckingUpdate} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg active:scale-95 disabled:opacity-50 transition-all">
                        {isCheckingUpdate ? "Checking..." : "Check for Updates"}
                    </button>
                </div>
                {updateAvailable && latestRelease && (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-green-700">New Version Available</p>
                            <p className="text-[10px] text-green-600">Build v{latestRelease.version}</p>
                        </div>
                        <button onClick={() => window.open(latestRelease.download_url, '_system')} className="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg">Update</button>
                    </div>
                )}
            </div>
          </div>
        );
      case 'about':
        return (
            <div className="animate-fade-in">
                <ViewHeader title="About Application" />
                <div className="p-8 space-y-8 text-center">
                    <div className="mx-auto w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center p-4 shadow-xl">
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <rect x="15" y="25" width="70" height="55" rx="8" fill="#10B981"/>
                            <path d="M28 62 L45 45 L58 55 L75 30" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">GB Finance 2.0</h3>
                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Personal Finance Tracker</p>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-6 text-left space-y-3">
                        <div className="flex justify-between items-center"><span className="text-xs text-slate-400">Version</span><span className="text-xs font-bold text-slate-900 dark:text-white">{APP_VERSION}</span></div>
                        <div className="flex justify-between items-center"><span className="text-xs text-slate-400">Database</span><span className="text-xs font-bold text-slate-900 dark:text-white">Supabase Cloud</span></div>
                        <div className="flex justify-between items-center"><span className="text-xs text-slate-400">Developer</span><span className="text-xs font-bold text-slate-900 dark:text-white">GB Finance Hub</span></div>
                    </div>
                </div>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto h-[calc(100dvh-4.5rem-var(--sat,0px)-4rem)] flex flex-col bg-white dark:bg-slate-950 overflow-hidden border-x border-slate-100 dark:border-slate-900">
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center px-4 h-14">
            <button 
                onClick={() => activeSubView === 'menu' ? (window.history.back()) : setActiveSubView('menu')}
                className="p-2 -ml-2 text-slate-900 dark:text-white"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="flex-grow text-center font-bold text-slate-900 dark:text-white mr-8">
                {activeSubView === 'menu' ? 'Settings' : 'Settings'}
            </h1>
        </div>

        {activeSubView === 'menu' && (
          <div className="px-4 pb-3">
              <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:ring-0 outline-none"
                    placeholder="Search settings..."
                  />
              </div>
          </div>
        )}
      </header>

      <div className="flex-grow overflow-y-auto no-scrollbar bg-slate-50/50 dark:bg-slate-950">
        {activeSubView === 'menu' ? (
          <div className="animate-fade-in pb-10">
            {filteredGroups.map((group) => (
              <div key={group.title}>
                <SectionHeader title={group.title} />
                <div className="bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/50">
                    {group.items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSubView(item.id as SubView)}
                            className="w-full flex items-center justify-between py-3.5 px-4 group active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg text-white ${item.color}`}>
                                    {item.icon}
                                </div>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.label}</span>
                            </div>
                            <svg className="w-4 h-4 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    ))}
                </div>
              </div>
            ))}
            
            {filteredGroups.length === 0 && (
                <div className="py-20 text-center text-slate-400 text-sm italic">
                    No matching settings found
                </div>
            )}

            <div className="mt-10 px-5 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Version {APP_VERSION}</p>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in bg-white dark:bg-slate-900 h-full">
             {renderActiveView()}
          </div>
        )}
      </div>

      {showDeleteAccountModal && (
          <ConfirmDeleteAccount 
            onConfirm={handleDeleteAccount}
            onClose={() => setShowDeleteAccountModal(false)}
            isLoading={isDeletingAccount}
          />
      )}
    </div>
  );
};

export default SettingsPage;
