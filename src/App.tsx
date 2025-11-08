import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Transaction } from './types';
import { calculateTotalAmount } from './utils/transactionUtils';
import BottomNav from './components/SideNav';
import HomePage from './pages/HomePage';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import Modal, { ModalProps } from './components/Modal';
import Toast, { ToastProps } from './components/Toast';
import TransactionDetailView from './components/reports/TransactionDetailView';
import LoginPage from './pages/LoginPage';
import { SessionContextProvider, useSession } from './components/SessionContextProvider';
import EditTransactionForm from './components/EditTransactionForm';
import {
  getInitialData,
  addTransaction as addTransactionSupabase,
  updateTransaction as updateTransactionSupabase,
  deleteTransaction as deleteTransactionSupabase,
  addCategory as addCategorySupabase,
  deleteCategory as deleteCategorySupabase,
} from './services/supabase';

export type Page = 'home' | 'transactions' | 'reports' | 'settings';

const AppContent: React.FC = () => {
  const { session, user, isLoading: isAuthLoading } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [modalState, setModalState] = useState<Omit<ModalProps, 'onClose'>>({ isOpen: false, title: '', children: null });
  const [toastState, setToastState] = useState<Omit<ToastProps, 'onClose'>>({ isVisible: false, message: '' });
  
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastState({ isVisible: true, message, type });
  }, []);

  useEffect(() => {
    if (toastState.isVisible) {
      const timer = setTimeout(() => setToastState(prev => ({...prev, isVisible: false})), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastState.isVisible]);

  const fetchData = useCallback(async () => {
    if (user) {
      setIsDataLoading(true);
      try {
        const { transactions: fetchedTransactions, categories: fetchedCategories } = await getInitialData();
        setTransactions(fetchedTransactions);
        setCategories(fetchedCategories);
      } catch (error: any) {
        console.error("Error fetching initial data:", error.message || error);
        showToast(`Failed to load data: ${error.message || 'Unknown error'}`, "error");
      } finally {
        setIsDataLoading(false);
      }
    } else {
      setTransactions([]);
      setCategories([]);
      setIsDataLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showModal = (config: Omit<ModalProps, 'isOpen' | 'onClose'>) => {
    setModalState({ isOpen: true, ...config });
  };

  const closeModal = () => {
    setModalState(prev => ({...prev, isOpen: false}));
  };
  
  const { totalSales, totalExpenses, netProfit } = useMemo(() => {
    const sales = transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + calculateTotalAmount(t.items), 0);
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + calculateTotalAmount(t.items), 0);
    return {
      totalSales: sales,
      totalExpenses: expenses,
      netProfit: sales - expenses,
    };
  }, [transactions]);
  
  const transactionDescriptions = useMemo(() => (
    [...new Set(transactions.map(t => t.description.trim()).filter(Boolean))]
  ), [transactions]);

  const itemDescriptions = useMemo(() => (
    [...new Set(transactions.flatMap(t => t.items.map(i => i.description.trim())).filter(Boolean))]
  ), [transactions]);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>) => {
    if (!user) {
      showToast("Please log in to add transactions.", "error");
      return;
    }
    try {
      const newTransaction: Transaction = {
        ...transaction,
        id: new Date().getTime().toString(), // Temp ID, Supabase will assign real one
        date: new Date().toISOString(),
        items: transaction.items.map(item => ({...item, id: new Date().getTime().toString() + Math.random()})), // Temp IDs
      };
      await addTransactionSupabase(newTransaction);
      await fetchData(); // Re-fetch data to get the latest from Supabase
      showToast('Transaction added successfully!');
    } catch (error: any) {
      console.error("Error adding transaction:", error.message || error);
      showToast(`Failed to add transaction: ${error.message || 'Unknown error'}`, "error");
    }
  };

  const updateTransaction = async (updatedTransaction: Transaction) => {
    if (!user) {
      showToast("Please log in to update transactions.", "error");
      return;
    }
    try {
      await updateTransactionSupabase(updatedTransaction);
      await fetchData(); // Re-fetch data to get the latest from Supabase
      showToast('Transaction updated successfully!');
    } catch (error: any) {
      console.error("Error updating transaction:", error.message || error);
      showToast(`Failed to update transaction: ${error.message || 'Unknown error'}`, "error");
    }
  };

  const deleteTransactionInDB = async (id: string) => {
    if (!user) {
      showToast("Please log in to delete transactions.", "error");
      return;
    }
    try {
      await deleteTransactionSupabase(id);
      await fetchData(); // Re-fetch data
      closeModal();
      showToast('Transaction deleted.', 'success');
    } catch (error: any) {
      console.error("Error deleting transaction:", error.message || error);
      showToast(`Failed to delete transaction: ${error.message || 'Unknown error'}`, "error");
    }
  }

  const deleteTransaction = (id: string) => {
     showModal({
        title: 'Delete Transaction',
        children: <p>Are you sure you want to delete this transaction? This action cannot be undone.</p>,
        confirmText: 'Delete',
        onConfirm: () => deleteTransactionInDB(id),
        confirmVariant: 'danger'
     });
  };
  
  const addCategory = async (category: string) => {
    if (!user) {
      showToast("Please log in to add categories.", "error");
      return;
    }
    const trimmedCategory = category.trim();
    if (trimmedCategory && !categories.find(c => c.toLowerCase() === trimmedCategory.toLowerCase())) {
        try {
            await addCategorySupabase(trimmedCategory, user.id);
            await fetchData(); // Re-fetch categories
            showToast(`Category "${trimmedCategory}" added.`);
        } catch (error: any) {
            console.error("Error adding category:", error.message || error);
            showToast(`Failed to add category: ${error.message || 'Unknown error'}`, "error");
        }
    } else if (trimmedCategory) {
        showToast(`Category "${trimmedCategory}" already exists.`, 'error');
    }
  };

  const deleteCategoryFromDB = async (categoryToDelete: string) => {
    if (!user) {
      showToast("Please log in to delete categories.", "error");
      return;
    }
    try {
      await deleteCategorySupabase(categoryToDelete, user.id);
      await fetchData(); // Re-fetch categories
      closeModal();
      showToast(`Category "${categoryToDelete}" deleted.`);
    } catch (error: any) {
      console.error("Error deleting category:", error.message || error);
      showToast(`Failed to delete category: ${error.message || 'Unknown error'}`, "error");
    }
  };

  const deleteCategory = (categoryToDelete: string) => {
    const isCategoryInUse = transactions.some(t => t.category === categoryToDelete);
    if (isCategoryInUse) {
        showModal({
            title: 'Cannot Delete Category',
            children: <p>This category is currently in use by one or more transactions. Please reassign them before deleting.</p>,
        });
        return;
    }
    showModal({
        title: 'Delete Category',
        children: <p>Are you sure you want to delete the category "{categoryToDelete}"?</p>,
        confirmText: 'Delete',
        onConfirm: () => deleteCategoryFromDB(categoryToDelete),
        confirmVariant: 'danger'
    });
  };

  const handleResetData = () => {
    // For Supabase, resetting all data for a user would involve deleting all their transactions and categories.
    // This is a more complex operation than localStorage. For simplicity, we'll just show a message.
    // A full implementation would require a server-side function or multiple client-side deletes.
    showModal({
        title: 'Reset All Data',
        children: <p>Resetting all data is not directly supported via client-side for Supabase. Please contact support or manually delete data from your Supabase dashboard if needed.</p>,
        confirmText: 'OK',
        onConfirm: closeModal,
    });
  };
  
  const handleStartEdit = (transaction: Transaction) => {
    showModal({
      title: 'Edit Transaction',
      children: <EditTransactionForm 
                  transaction={transaction} 
                  categories={categories} 
                  onSave={(updatedTransaction) => {
                    updateTransaction(updatedTransaction);
                    closeModal();
                  }}
                  onCancel={closeModal}
                />,
      hideFooter: true,
    });
  };
  
  const handleViewTransaction = (transaction: Transaction) => {
    showModal({
      title: `Transaction Details`,
      children: <TransactionDetailView 
                  transaction={transaction} 
                  onEdit={() => handleStartEdit(transaction)}
                  onDelete={() => {
                    closeModal();
                    deleteTransaction(transaction.id);
                  }}
                />,
      hideFooter: true,
    });
  };

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-brand-secondary">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4 border-b border-gray-200 text-center sticky top-0 z-10">
          <div className="flex items-center justify-center relative">
            <h1 className="text-xl md:text-2xl font-bold text-brand-primary">
            GB Finance 2.0
            </h1>
          </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-6 lg:p-8 pb-24">
          <Routes>
            <Route path="/" element={<HomePage 
                                        stats={{ totalSales, totalExpenses, netProfit }} 
                                        transactions={transactions}
                                        onTransactionClick={handleViewTransaction}
                                      />} 
            />
            <Route path="/transactions" element={<TransactionsPage 
                                                    transactions={transactions} 
                                                    addTransaction={addTransaction}
                                                    categories={categories}
                                                    addCategory={addCategory}
                                                    onTransactionClick={handleViewTransaction}
                                                    transactionDescriptions={transactionDescriptions}
                                                    itemDescriptions={itemDescriptions}
                                                  />} 
            />
            <Route path="/reports" element={<ReportsPage 
                                                transactions={transactions} 
                                                categories={categories} 
                                                onTransactionClick={handleViewTransaction}
                                              />} 
            />
            <Route path="/settings" element={<SettingsPage 
                                                  onResetData={handleResetData}
                                                  categories={categories}
                                                  onAddCategory={addCategory}
                                                  onDeleteCategory={deleteCategory}
                                              />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} /> {/* Redirect any unknown routes to home */}
          </Routes>
      </main>
      
      <BottomNav /> {/* BottomNav no longer needs currentPage or setCurrentPage */}

      <Modal {...modalState} onClose={closeModal} />
      <Toast {...toastState} onClose={() => setToastState(prev => ({...prev, isVisible: false}))} />
    </div>
  );
};

const App: React.FC = () => (
  <Router>
    <SessionContextProvider>
      <AppContent />
    </SessionContextProvider>
  </Router>
);

export default App;