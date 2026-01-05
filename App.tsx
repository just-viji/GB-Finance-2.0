
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { loadData, saveTransactions, saveCategories, clearAllData as clearAllDataFromDB, onAuthStateChange, signOut } from './services/supabase';
import { Transaction, TransactionType, AppRelease } from './types';
// Fix: Added missing importTransactionsFromCSV to the imports from transactionUtils.
import { calculateTotalAmount, importTransactionsFromCSV } from './utils/transactionUtils';
import { APP_VERSION } from './constants';
import BottomNav from './components/SideNav';
import HomePage from './pages/HomePage';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import Modal, { ModalProps } from './components/Modal';
import Toast, { ToastProps } from './components/Toast';
import TransactionDetailView from './components/reports/TransactionDetailView';
import LoginPage from './pages/LoginPage';
import Header from './components/Header';
import { Session } from '@supabase/supabase-js';
import TransactionForm from './components/TransactionForm';
import EditTransactionForm from './components/EditTransactionForm';
import ConfirmDeleteAllData from './components/ConfirmDeleteAllData';
import ScanToPay from './components/ScanToPay';
import SetPasswordForm from './components/SetPasswordForm';
import { getLatestRelease, isUpdateAvailable } from './services/versionService';

export type Page = 'home' | 'transactions' | 'reports' | 'settings';

const FullScreenLoader: React.FC<{ message: string }> = ({ message }) => (
    <div className="fixed inset-0 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm flex flex-col justify-center items-center z-50" role="status" aria-live="polite">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center font-black text-brand-primary">GB</div>
        </div>
        <p className="mt-6 text-sm font-black text-brand-dark dark:text-slate-200 uppercase tracking-[0.3em]">{message}</p>
    </div>
);

const MandatoryUpdateOverlay: React.FC<{ release: AppRelease }> = ({ release }) => (
    <div className="fixed inset-0 bg-brand-dark/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-8 max-w-sm w-full shadow-2xl space-y-6">
            <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-lg flex items-center justify-center mx-auto text-red-600 border border-red-100 dark:border-red-900/40">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Security Update Required</h2>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">A mandatory update (v{release.version}) is required to continue using the finance hub.</p>
            </div>
            <button 
                onClick={() => window.open(release.download_url, '_blank')}
                className="w-full py-4 bg-brand-dark dark:bg-brand-primary text-white font-black rounded-lg shadow-lg hover:bg-slate-800 dark:hover:bg-brand-primary-hover transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
            >
                Get Update Now
            </button>
            <p className="text-[9px] text-gray-400 uppercase tracking-[0.2em] font-black">Managed Infrastructure</p>
        </div>
    </div>
);

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [modalProps, setModalProps] = useState<Omit<ModalProps, 'onClose'>>({ isOpen: false, title: '', children: null });
  const [toastProps, setToastProps] = useState<Omit<ToastProps, 'onClose'>>({ isVisible: false, message: '' });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('gb-finance-theme') as 'light' | 'dark') || 'light');

  const [passwordCheckDone, setPasswordCheckDone] = useState(false);
  
  const [mandatoryRelease, setMandatoryRelease] = useState<AppRelease | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('gb-finance-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const closeModal = () => {
    setModalProps({ isOpen: false, title: '', children: null });
  };

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastProps({ message, type, isVisible: true });
    setTimeout(() => {
      setToastProps(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  }, []);

  useEffect(() => {
    const subscription = onAuthStateChange(setSession);
    return () => {
      subscription?.unsubscribe();
    };
  }, []);
  
  useEffect(() => {
    const bootstrap = async () => {
        if (session) {
            setIsLoading(true);
            try {
                const latest = await getLatestRelease();
                if (latest && latest.is_mandatory && isUpdateAvailable(APP_VERSION, latest.version)) {
                    setMandatoryRelease(latest);
                    setIsLoading(false);
                    return; 
                }

                if (!passwordCheckDone && session.user?.identities) {
                    const hasEmailIdentity = session.user.identities.some((id: any) => id.provider === 'email');
                    const hasPasswordSetMetadata = session.user.user_metadata?.password_set === true;
                    const isDemo = session.user.id === 'demo-user-123';
                    
                    if (!hasEmailIdentity && !hasPasswordSetMetadata && !isDemo) {
                        setModalProps({
                            isOpen: true,
                            title: 'Secure Your Account',
                            hideFooter: true,
                            children: (
                                <SetPasswordForm 
                                    onSuccess={() => {
                                        showToast("Credentials updated.", "success");
                                        closeModal();
                                        setPasswordCheckDone(true);
                                    }}
                                    onSkip={() => {
                                        closeModal();
                                        setPasswordCheckDone(true);
                                    }}
                                />
                            )
                        });
                    } else {
                         setPasswordCheckDone(true);
                    }
                }

                const { transactions: loadedTransactions, categories: loadedCategories } = await loadData();
                setTransactions(loadedTransactions);
                setCategories(loadedCategories);
            } catch (e: any) {
                showToast(`Sync Error: ${e.message}`, 'error');
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
            setPasswordCheckDone(false);
        }
    };
    bootstrap();
  }, [session, dataVersion, passwordCheckDone, showToast]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
        showToast(`Logout failed: ${error.message}`, 'error');
    } else {
        setTransactions([]);
        setCategories([]);
        setCurrentPage('home');
    }
  };

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const stats = useMemo(() => {
    return transactions.reduce((acc, t) => {
      const totalAmount = calculateTotalAmount(t.items);
      if (t.type === 'income') {
        acc.totalIncome += totalAmount;
      } else {
        acc.totalExpenses += totalAmount;
      }
      return acc;
    }, { totalIncome: 0, totalExpenses: 0, netSavings: 0 });
  }, [transactions]);
  stats.netSavings = stats.totalIncome - stats.totalExpenses;

  const transactionDescriptions = useMemo(() => Array.from(new Set(transactions.map(t => t.description))), [transactions]);
  const itemDescriptions = useMemo(() => Array.from(new Set(transactions.flatMap(t => t.items.map(i => i.description)))), [transactions]);

  const addTransaction = async (newTransactionData: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...newTransactionData,
      id: new Date().getTime().toString(),
      created_at: new Date().toISOString(),
      items: newTransactionData.items.map((item, index) => ({
        ...item,
        id: `${new Date().getTime()}-${index}`
      }))
    };
    const previousTransactions = transactions;
    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);

    try {
      await saveTransactions(updatedTransactions);
      showToast(`${newTransaction.type === 'income' ? 'Sale' : 'Expense'} recorded.`, 'success');
    } catch(e) {
      console.error(e);
      setTransactions(previousTransactions);
      showToast(`Save failed.`, 'error');
    }
  };

  const updateTransaction = async (updatedTransaction: Transaction) => {
    const previousTransactions = transactions;
    const updatedTransactions = transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
    setTransactions(updatedTransactions);
    setSelectedTransaction(null);
    setModalProps({isOpen: false, title: '', children: null});

    try {
      await saveTransactions(updatedTransactions);
      showToast('Record updated.', 'success');
    } catch(e) {
      console.error(e);
      setTransactions(previousTransactions);
      showToast(`Update failed.`, 'error');
    }
  }

  const handleDeleteRequest = () => {
    if (!selectedTransaction) return;
    const transactionToDelete = selectedTransaction;
    setSelectedTransaction(null);
    
     setModalProps({
        isOpen: true,
        title: 'Confirm Deletion',
        children: `Permanently delete record: "${transactionToDelete.description}"?`,
        onConfirm: async () => {
            setModalProps({isOpen: false, title: '', children: null});
            await handleDeleteConfirm(transactionToDelete.id)
        },
        confirmText: 'Delete Record',
        confirmVariant: 'danger'
    });
  }

  const handleDeleteConfirm = async (id: string) => {
    const previousTransactions = transactions;
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);

    try {
        await saveTransactions(updatedTransactions);
        showToast('Record removed.', 'success');
    } catch (error) {
        console.error(error);
        setTransactions(previousTransactions);
        showToast(`Delete failed.`, 'error');
    }
  }
  
  const addCategory = async (newCategory: string) => {
    if (categories.some(c => c.toLowerCase() === newCategory.toLowerCase())) {
        showToast('Exists.', 'error');
        return;
    }
    const previousCategories = categories;
    const updatedCategories = [...categories, newCategory].sort();
    setCategories(updatedCategories);
    
    try {
        await saveCategories(updatedCategories);
        showToast('Category saved.', 'success');
    } catch (e) {
        setCategories(previousCategories);
        showToast(`Failed.`, 'error');
    }
  };

  const deleteCategory = async (categoryToDelete: string) => {
    if(transactions.some(t => t.category === categoryToDelete)) {
        showToast('In use.', 'error');
        return;
    }
    const previousCategories = categories;
    const updatedCategories = categories.filter(c => c !== categoryToDelete);
    setCategories(updatedCategories);
    
    try {
        await saveCategories(updatedCategories);
        showToast('Category removed.', 'success');
    } catch (e) {
        setCategories(previousCategories);
        showToast(`Failed.`, 'error');
    }
  };
  
  const handleClearAllData = () => {
    setModalProps({
        isOpen: true,
        title: 'Factory Reset Hub',
        children: 'This will permanently wipe all your records and custom categories. Confirm to proceed.',
        onConfirm: () => {
            setModalProps({
                isOpen: true,
                title: 'Final Confirmation',
                hideFooter: true,
                children: (
                    <ConfirmDeleteAllData 
                        onConfirm={async () => {
                            try {
                                setIsLoading(true);
                                await clearAllDataFromDB();
                                setTransactions([]);
                                setCategories([]);
                                showToast('System wiped.', 'success');
                            } catch (e) {
                                showToast(`Wipe failed.`, 'error');
                            } finally {
                                setIsLoading(false);
                                setModalProps({isOpen: false, title: '', children: null});
                                setCurrentPage('home');
                            }
                        }}
                        onClose={closeModal}
                    />
                )
            });
        },
        confirmText: 'Wipe Data',
        confirmVariant: 'danger'
    });
  };

  const handleImportTransactions = async (file: File) => {
    setIsLoading(true);
    try {
      const fileContent = await file.text();
      const importedTransactions = importTransactionsFromCSV(fileContent);

      if (importedTransactions.length === 0) {
        showToast('Empty file.', 'error');
        return;
      }

      const existingIds = new Set(transactions.map(t => t.id));
      const newTransactions = importedTransactions.filter(t => !existingIds.has(t.id));

      if (newTransactions.length === 0) {
        showToast('No new records found.', 'error');
        return;
      }

      const updatedTransactions = [...transactions, ...newTransactions];
      setTransactions(updatedTransactions);
      await saveTransactions(updatedTransactions);

      showToast(`Imported ${newTransactions.length} records.`, 'success');
    } catch (e) {
      showToast(`Import failed.`, 'error');
    } finally {
      setIsLoading(false);
    }
  };


  const handleTransactionSelect = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  }

  const handleAddTransactionClick = (initialType?: TransactionType, autoScan = false) => {
    setModalProps({
      isOpen: true,
      title: autoScan ? 'Optical Receipt Scanner' : 'New Financial Entry',
      hideFooter: true,
      fullPage: true,
      children: (
        <TransactionForm
          onSubmit={(newTransactionData) => {
            addTransaction(newTransactionData);
            closeModal();
          }}
          onCancel={closeModal}
          categories={categories}
          transactionDescriptions={transactionDescriptions}
          itemDescriptions={itemDescriptions}
          showToast={showToast}
          initialType={initialType}
          autoScan={autoScan}
        />
      ),
    });
  };

  const handleScanToPayClick = () => {
    setModalProps({
        isOpen: true,
        title: 'UPI Payment Link',
        hideFooter: true,
        fullPage: true,
        children: (
            <ScanToPay 
                onCancel={closeModal}
                onSave={(data) => {
                    addTransaction(data);
                }}
                categories={categories}
            />
        )
    });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage 
            stats={stats} 
            transactions={sortedTransactions} 
            onTransactionClick={handleTransactionSelect}
            onAddTransaction={handleAddTransactionClick}
            onScanToPay={handleScanToPayClick}
        />;
      case 'transactions':
        return <TransactionsPage 
          transactions={sortedTransactions} 
          onTransactionClick={handleTransactionSelect}
          onAddTransactionClick={() => handleAddTransactionClick()}
        />;
      case 'reports':
        return <ReportsPage transactions={transactions} categories={categories} onTransactionClick={handleTransactionSelect} />;
      case 'settings':
        return <SettingsPage
            userEmail={session?.user?.email}
            userAvatar={session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture}
            transactions={sortedTransactions}
            categories={categories} 
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
            onClearAllData={handleClearAllData}
            onLogout={handleLogout}
            onImportTransactions={handleImportTransactions}
            onDataReload={() => setDataVersion(v => v + 1)}
            showToast={showToast}
            theme={theme}
            onThemeToggle={toggleTheme}
        />;
      default:
        return <HomePage 
            stats={stats} 
            transactions={sortedTransactions} 
            onTransactionClick={handleTransactionSelect}
            onAddTransaction={handleAddTransactionClick}
            onScanToPay={handleScanToPayClick}
        />;
    }
  };

  if (!session) {
    return <LoginPage />;
  }

  if (isLoading) {
    return <FullScreenLoader message="Initializing Financial Hub..." />
  }

  if (mandatoryRelease) {
      return <MandatoryUpdateOverlay release={mandatoryRelease} />
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-brand-dark dark:text-slate-100 transition-colors duration-200">
      <Header 
        userEmail={session.user?.email}
        userAvatar={session.user?.user_metadata?.avatar_url || session.user?.user_metadata?.picture}
        onAddTransaction={() => handleAddTransactionClick()} 
        onProfileClick={() => setCurrentPage('settings')}
        theme={theme}
        onThemeToggle={toggleTheme}
      />
      <main className="pb-28 md:max-w-7xl md:mx-auto">
        {renderPage()}
      </main>
      <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <Modal {...modalProps} onClose={closeModal} />
      <Toast {...toastProps} onClose={() => setToastProps(prev => ({ ...prev, isVisible: false }))} />

      <Modal isOpen={!!selectedTransaction} onClose={() => setSelectedTransaction(null)} title="Record Overview" hideFooter>
        {selectedTransaction && (
            <TransactionDetailView 
                transaction={selectedTransaction}
                onEdit={() => {
                   setModalProps({
                        isOpen: true,
                        title: "Edit Record",
                        children: <EditTransactionForm 
                            transaction={selectedTransaction}
                            onSave={updateTransaction}
                            onCancel={() => setModalProps({isOpen: false, title: '', children: null})}
                            categories={categories}
                        />,
                        hideFooter: true
                   });
                   setSelectedTransaction(null);
                }}
                onDelete={handleDeleteRequest}
            />
        )}
      </Modal>
    </div>
  );
}
