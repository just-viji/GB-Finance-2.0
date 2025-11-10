import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    addCategory as addCategoryToSupabase,
    deleteCategory as deleteCategoryFromSupabase,
    getTransactions as getTransactionsFromSupabase,
    getCategories as getCategoriesFromSupabase,
    addTransaction as addTransactionToSupabase, 
    updateTransaction as updateTransactionInSupabase,
    deleteTransaction as deleteTransactionFromSupabase,
    getCurrentUser,
    signOut
} from './services/supabase';
import { Transaction, TransactionLineItem } from './types';
import { INITIAL_CATEGORIES, PAYMENT_METHODS } from './constants';
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


export type Page = 'home' | 'transactions' | 'reports' | 'settings';

// Placed here to avoid creating a new file, as per user constraints.
interface EditTransactionFormProps {
    transaction: Transaction;
    onSave: (transaction: Transaction) => void;
    onCancel: () => void;
    categories: string[];
}
const EditTransactionForm: React.FC<EditTransactionFormProps> = ({ transaction, onSave, onCancel, categories }) => {
    const [editedTransaction, setEditedTransaction] = useState(transaction);

    const handleSave = () => {
        const hasInvalidItem = editedTransaction.items.some(i => !i.description || (i.unitPrice || 0) <= 0 || (i.quantity || 0) <= 0);
        if (!editedTransaction.description || editedTransaction.items.length === 0 || hasInvalidItem) {
            alert('Please provide a main description and ensure all items have a description, a quantity greater than 0, and a price greater than 0.');
            return;
        }
        onSave(editedTransaction);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'date') {
            const timePart = editedTransaction.date.includes('T') ? editedTransaction.date.split('T')[1] : '00:00:00.000Z';
            const newIsoDate = `${value}T${timePart}`;
            setEditedTransaction(prev => ({ ...prev, date: newIsoDate }));
        } else {
            setEditedTransaction(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleItemChange = (index: number, field: keyof TransactionLineItem, value: string | number) => {
        const newItems = [...editedTransaction.items];
        const item = {...newItems[index]};
        (item[field] as any) = (field === 'quantity' || field === 'unitPrice') ? (typeof value === 'string' ? parseFloat(value) || 0 : value) : value;
        newItems[index] = item;
        setEditedTransaction(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        const newItem: TransactionLineItem = { id: new Date().getTime().toString(), description: '', quantity: 1, unitPrice: 0 };
        setEditedTransaction(prev => ({ ...prev, items: [...prev.items, newItem] }));
    };

    const removeItem = (index: number) => {
        if (editedTransaction.items.length > 1) {
          setEditedTransaction(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
        }
    };

    const editedTotal = calculateTotalAmount(editedTransaction.items);

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-3">
                    <label className="text-sm font-medium text-brand-secondary mb-1 block">Overall Description</label>
                    <input type="text" name="description" value={editedTransaction.description} onChange={handleChange} placeholder="Overall Description" className="w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary" />
                </div>
                <div className="md:col-span-2">
                    <label className="text-sm font-medium text-brand-secondary mb-1 block">Date</label>
                    <input type="date" name="date" value={editedTransaction.date.split('T')[0]} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary" />
                </div>
            </div>
            
            <fieldset>
                <legend className="text-sm font-medium text-brand-secondary mb-2">Items</legend>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {editedTransaction.items.map((item, index) => {
                        const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
                        return (
                            <div key={item.id} className="grid grid-cols-12 gap-2 p-1 items-center">
                                <input type="text" placeholder="Item Desc." value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} className="col-span-12 sm:col-span-5 bg-white border border-gray-300 text-brand-dark rounded-md p-1 text-sm focus:ring-brand-primary focus:border-brand-primary" />
                                <input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value))} className="col-span-3 sm:col-span-2 bg-white border border-gray-300 text-brand-dark rounded-md p-1 text-sm focus:ring-brand-primary focus:border-brand-primary" min="1" />
                                <input type="number" placeholder="Price" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} className="col-span-4 sm:col-span-2 bg-white border border-gray-300 text-brand-dark rounded-md p-1 text-sm focus:ring-brand-primary focus:border-brand-primary" min="0" step="0.01"/>
                                <div className="col-span-3 sm:col-span-2 text-right pr-1">
                                    <p className="text-sm font-medium text-brand-dark truncate">
                                        {lineTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                    </p>
                                </div>
                                <button type="button" onClick={() => removeItem(index)} disabled={editedTransaction.items.length <= 1} className="col-span-2 sm:col-span-1 flex justify-center items-center text-red-500 hover:bg-red-100 rounded-md disabled:opacity-50"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                            </div>
                        );
                    })}
                </div>
                <button type="button" onClick={addItem} className="w-full text-xs font-semibold text-brand-primary hover:text-brand-primary-hover py-1">+ Add Item</button>
            </fieldset>

            <p className="text-right font-semibold">Total: {editedTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
            
            <div className={`grid ${editedTransaction.type === 'expense' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                 {editedTransaction.type === 'expense' && (
                    <div>
                        <label className="text-sm font-medium text-brand-secondary mb-1 block">Category</label>
                        <select name="category" value={editedTransaction.category} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary">
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                 )}
                 <div>
                    <label className="text-sm font-medium text-brand-secondary mb-1 block">Payment Method</label>
                    <select name="paymentMethod" value={editedTransaction.paymentMethod} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary">
                        {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                    </select>
                 </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button onClick={onCancel} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm rounded-md font-semibold bg-brand-primary text-white hover:bg-brand-primary-hover">Save Changes</button>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);


  const [modalState, setModalState] = useState<Omit<ModalProps, 'onClose'>>({ isOpen: false, title: '', children: null });
  const [toastState, setToastState] = useState<Omit<ToastProps, 'onClose'>>({ isVisible: false, message: '' });
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastState({ isVisible: true, message, type });
  };

  useEffect(() => {
    const checkUser = async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            // Not handling error, assuming it means user is not logged in
        } finally {
            setIsAuthLoading(false);
        }
    };
    checkUser();
}, []);
  
  // Load data from local storage on mount
  useEffect(() => {
    const loadData = async () => {
        if (!user) return;
        try {
            const [loadedTransactions, loadedCategories] = await Promise.all([
                getTransactionsFromSupabase(),
                getCategoriesFromSupabase(),
            ]);
            setTransactions((loadedTransactions as Transaction[]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setCategories((loadedCategories as string[]).sort());
        } catch (error) {
            showToast('Error fetching data', 'error');
        } finally {
            setIsDataLoaded(true);
        }
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (toastState.isVisible) {
      const timer = setTimeout(() => setToastState(prev => ({...prev, isVisible: false})), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastState.isVisible]);

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
    try {
        const newTransaction: Omit<Transaction, 'id'> = {
            ...transaction,
            date: new Date().toISOString(),
            items: transaction.items.map(item => ({...item, id: new Date().getTime().toString() + Math.random()})),
        };
        
        const returnedTransaction = await addTransactionToSupabase(newTransaction);

        const updatedTransactions = [returnedTransaction[0], ...transactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setTransactions(updatedTransactions);
        showToast('Transaction added successfully!');
    } catch (error) {
        showToast('Error adding transaction', 'error');
    }
  };

  const updateTransaction = async (updatedTransaction: Transaction) => {
    try {
        await updateTransactionInSupabase(updatedTransaction);
        const updatedTransactions = transactions
            .map(t => (t.id === updatedTransaction.id ? updatedTransaction : t))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setTransactions(updatedTransactions);
        showToast('Transaction updated successfully!');
    } catch (error) {
        showToast('Error updating transaction', 'error');
    }
  };

  const deleteTransactionInDB = async (id: string) => {
    try {
        await deleteTransactionFromSupabase(id);
        const updatedTransactions = transactions.filter(t => t.id !== id);
        setTransactions(updatedTransactions);
        showToast('Transaction deleted.', 'success');
        closeModal();
    } catch (error) {
        showToast('Error deleting transaction', 'error');
        closeModal();
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
    if (category && !categories.find(c => c.toLowerCase() === category.toLowerCase())) {
        try {
            await addCategoryToSupabase(category);
            const updatedCategories = [...categories, category].sort();
            setCategories(updatedCategories);
            showToast(`Category "${category}" added.`);
        } catch (error) {
            showToast('Error adding category', 'error');
        }
    } else if (category) {
        showToast(`Category "${category}" already exists.`, 'error');
    }
  };

  const deleteCategoryFromDB = async (categoryToDelete: string) => {
    try {
        await deleteCategoryFromSupabase(categoryToDelete);
        const updatedCategories = categories.filter(c => c !== categoryToDelete);
        setCategories(updatedCategories);
        showToast(`Category "${categoryToDelete}" deleted.`);
        closeModal();
    } catch (error) {
        showToast('Error deleting category', 'error');
        closeModal();
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
                    // This now calls the modal version of delete
                    deleteTransaction(transaction.id);
                  }}
                />,
      hideFooter: true,
    });
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setTransactions([]);
    setCategories([]);
    setIsDataLoaded(false);
    setCurrentPage('home');
    showToast('You have been logged out.');
  };

  const renderPage = () => {
    if (!isDataLoaded) {
        return <div className="flex justify-center items-center h-64"><p>Loading...</p></div>;
    }
    switch (currentPage) {
      case 'home':
        return <HomePage 
                  stats={{ totalSales, totalExpenses, netProfit }} 
                  transactions={transactions}
                  onTransactionClick={handleViewTransaction}
               />;
      case 'transactions':
        return <TransactionsPage 
                  transactions={transactions} 
                  addTransaction={addTransaction}
                  categories={categories}
                  addCategory={addCategory}
                  onTransactionClick={handleViewTransaction}
                  transactionDescriptions={transactionDescriptions}
                  itemDescriptions={itemDescriptions}
               />;
      case 'reports':
        return <ReportsPage 
                  transactions={transactions} 
                  categories={categories} 
                  onTransactionClick={handleViewTransaction}
                />;
      case 'settings':
        return <SettingsPage transactions={transactions} onLogout={handleLogout} />;
      default:
        return <HomePage 
                  stats={{ totalSales, totalExpenses, netProfit }} 
                  transactions={transactions}
                  onTransactionClick={handleViewTransaction}
                />;
    }
  };

  if (isAuthLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
  }

  if (!user) {
      return <LoginPage showToast={showToast} setUser={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4 border-b border-gray-200 text-center sticky top-0 z-10">
          <h1 className="text-xl md:text-2xl font-bold text-brand-primary">
          GB Finance 2.0
          </h1>
      </header>
      
      <main className="container mx-auto p-4 md:p-6 lg:p-8 pb-24">
          {renderPage()}
      </main>
      
      <BottomNav
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
      />

      <Modal {...modalState} onClose={closeModal} />
      <Toast {...toastState} onClose={() => setToastState(prev => ({...prev, isVisible: false}))} />
    </div>
  );
};

export default App;
