import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { loadData, saveTransactions, saveCategories, clearAllData as clearAllDataFromDB } from './services/supabase';
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

export type Page = 'home' | 'transactions' | 'reports' | 'settings';

// Placed here to avoid creating a new file, as per user constraints.
type FormTransactionItem = Omit<TransactionLineItem, 'quantity' | 'unitPrice'> & {
    quantity: string;
    unitPrice: string;
};
type FormTransaction = Omit<Transaction, 'items'> & {
    items: FormTransactionItem[];
};
interface EditTransactionFormProps {
    transaction: Transaction;
    onSave: (transaction: Transaction) => void;
    onCancel: () => void;
    categories: string[];
}
const EditTransactionForm: React.FC<EditTransactionFormProps> = ({ transaction, onSave, onCancel, categories }) => {
    const [editedTransaction, setEditedTransaction] = useState<FormTransaction>(() => ({
        ...transaction,
        items: transaction.items.map(item => ({
            ...item,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
        }))
    }));

    const handleSave = () => {
        const finalTransaction: Transaction = {
            ...editedTransaction,
            items: editedTransaction.items.map(item => ({
                ...item,
                quantity: parseFloat(item.quantity) || 0,
                unitPrice: parseFloat(item.unitPrice) || 0,
            }))
        };
        const hasInvalidItem = finalTransaction.items.some(i => !i.description || (i.unitPrice || 0) <= 0 || (i.quantity || 0) <= 0);
        if (!finalTransaction.description || finalTransaction.items.length === 0 || hasInvalidItem) {
            alert('Please provide a main description and ensure all items have a description, a quantity greater than 0, and a price greater than 0.');
            return;
        }
        onSave(finalTransaction);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'date') {
            const timePart = editedTransaction.date.includes('T') ? editedTransaction.date.split('T')[1] : '00:00:00.000Z';
            const newIsoDate = `${value}T${timePart}`;
            setEditedTransaction(prev => ({ ...prev, date: newIsoDate }));
        } else {
            setEditedTransaction(prev => ({ ...prev, [name]: value as any }));
        }
    };

    const handleItemChange = (index: number, field: keyof Omit<FormTransactionItem, 'id'>, value: string) => {
        const newItems = [...editedTransaction.items];
        const item = {...newItems[index]};
        item[field] = value;
        newItems[index] = item;
        setEditedTransaction(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        const newItem: FormTransactionItem = { id: new Date().getTime().toString(), description: '', quantity: '1', unitPrice: '0' };
        setEditedTransaction(prev => ({ ...prev, items: [...prev.items, newItem] }));
    };

    const removeItem = (index: number) => {
        if (editedTransaction.items.length > 1) {
          setEditedTransaction(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
        }
    };

    const editedTotal = useMemo(() => {
        const numericItems: TransactionLineItem[] = editedTransaction.items.map(i => ({...i, quantity: parseFloat(i.quantity) || 0, unitPrice: parseFloat(i.unitPrice) || 0}));
        return calculateTotalAmount(numericItems);
    }, [editedTransaction.items]);

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
                        const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
                        return (
                            <div key={item.id} className="grid grid-cols-12 gap-2 p-1 items-center">
                                <input type="text" placeholder="Item Desc." value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} className="col-span-12 sm:col-span-5 bg-white border border-gray-300 text-brand-dark rounded-md p-1 text-sm focus:ring-brand-primary focus:border-brand-primary" />
                                <input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="col-span-3 sm:col-span-2 bg-white border border-gray-300 text-brand-dark rounded-md p-1 text-sm focus:ring-brand-primary focus:border-brand-primary" min="0.01" step="any" />
                                <input type="number" placeholder="Price" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', e.target.value)} className="col-span-4 sm:col-span-2 bg-white border border-gray-300 text-brand-dark rounded-md p-1 text-sm focus:ring-brand-primary focus:border-brand-primary" min="0" step="0.01" />
                                <div className="col-span-3 sm:col-span-2 text-right">
                                    <p className="text-xs font-medium text-brand-dark truncate">{lineTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
                                </div>
                                <button type="button" onClick={() => removeItem(index)} disabled={editedTransaction.items.length <= 1} className="col-span-2 sm:col-span-1 flex justify-center items-center text-red-500 hover:bg-red-100 rounded-full h-6 w-6 disabled:opacity-50 disabled:cursor-not-allowed"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg></button>
                            </div>
                        )
                    })}
                </div>
                <button type="button" onClick={addItem} className="w-full text-sm font-semibold text-brand-primary hover:text-brand-primary-hover mt-2">+ Add Item</button>
            </fieldset>
            <div className="flex justify-end font-bold text-brand-dark pr-2">
                Total: {editedTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
            </div>
            <div className="grid grid-cols-2 gap-4">
                {editedTransaction.type === 'expense' && (
                  <div>
                    <label className="text-sm font-medium text-brand-secondary mb-1 block">Category</label>
                    <select name="category" value={editedTransaction.category} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary">
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                )}
                <div className={editedTransaction.type === 'sale' ? 'col-span-2' : ''}>
                    <label className="text-sm font-medium text-brand-secondary mb-1 block">Payment Method</label>
                    <select name="paymentMethod" value={editedTransaction.paymentMethod} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary">
                        {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                    </select>
                </div>
            </div>
             <div className="mt-6 flex flex-row-reverse gap-3 pt-4 border-t border-gray-200">
                <button
                    onClick={handleSave}
                    className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 w-auto sm:text-sm transition-colors bg-brand-primary hover:bg-brand-primary-hover"
                >
                    Save Changes
                </button>
                <button
                    onClick={onCancel}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [modalProps, setModalProps] = useState<Omit<ModalProps, 'onClose'>>({ isOpen: false, title: '', children: null });
  const [toastProps, setToastProps] = useState<Omit<ToastProps, 'onClose'>>({ isVisible: false, message: '' });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    const { transactions: loadedTransactions, categories: loadedCategories, isNewUser } = loadData();
    setTransactions(loadedTransactions);
    setCategories(loadedCategories);
    if(isNewUser) {
        showToast('Welcome! Sample data has been loaded to get you started.', 'success');
    }
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastProps({ message, type, isVisible: true });
    setTimeout(() => {
      setToastProps(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  }, []);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const stats = useMemo(() => {
    return transactions.reduce((acc, t) => {
      const totalAmount = calculateTotalAmount(t.items);
      if (t.type === 'sale') {
        acc.totalSales += totalAmount;
      } else {
        acc.totalExpenses += totalAmount;
      }
      return acc;
    }, { totalSales: 0, totalExpenses: 0, netProfit: 0 });
  }, [transactions]);
  stats.netProfit = stats.totalSales - stats.totalExpenses;

  const transactionDescriptions = useMemo(() => Array.from(new Set(transactions.map(t => t.description))), [transactions]);
  const itemDescriptions = useMemo(() => Array.from(new Set(transactions.flatMap(t => t.items.map(i => i.description)))), [transactions]);

  const addTransaction = useCallback((newTransactionData: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
      ...newTransactionData,
      id: new Date().getTime().toString(),
      date: new Date().toISOString(),
      items: newTransactionData.items.map((item, index) => ({
        ...item,
        id: `${new Date().getTime()}-${index}`
      }))
    };
    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);
    showToast(`${newTransaction.type === 'sale' ? 'Sale' : 'Expense'} added successfully!`, 'success');
  }, [transactions, showToast]);

  const updateTransaction = (updatedTransaction: Transaction) => {
     const updatedTransactions = transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
     setTransactions(updatedTransactions);
     saveTransactions(updatedTransactions);
     setSelectedTransaction(null); // Close modal
     setModalProps({isOpen: false, title: '', children: null}); // also close the edit modal
     showToast('Transaction updated successfully!', 'success');
  }

  const handleDeleteRequest = () => {
    if (!selectedTransaction) return;
    
    // Capture the transaction before closing the detail modal
    const transactionToDelete = selectedTransaction;
    // Close the detail modal
    setSelectedTransaction(null);
    
     setModalProps({
        isOpen: true,
        title: 'Confirm Deletion',
        children: `Are you sure you want to delete the transaction: "${transactionToDelete.description}"? This action cannot be undone.`,
        onConfirm: () => {
            handleDeleteConfirm(transactionToDelete.id)
            setModalProps({isOpen: false, title: '', children: null});
        },
        confirmText: 'Delete',
        confirmVariant: 'danger'
    });
  }

  const handleDeleteConfirm = (id: string) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);
    showToast('Transaction deleted.', 'success');
  }
  
  const addCategory = useCallback((newCategory: string) => {
    if (categories.some(c => c.toLowerCase() === newCategory.toLowerCase())) {
        showToast('Category already exists.', 'error');
        return;
    }
    const updatedCategories = [...categories, newCategory].sort();
    setCategories(updatedCategories);
    saveCategories(updatedCategories);
    showToast('Category added.', 'success');
  }, [categories, showToast]);

  const deleteCategory = useCallback((categoryToDelete: string) => {
    if(transactions.some(t => t.category === categoryToDelete)) {
        showToast('Cannot delete category as it is used in some transactions.', 'error');
        return;
    }
    const updatedCategories = categories.filter(c => c !== categoryToDelete);
    setCategories(updatedCategories);
    saveCategories(updatedCategories);
    showToast('Category deleted.', 'success');
  }, [categories, transactions, showToast]);
  
  const handleClearAllData = () => {
    setModalProps({
        isOpen: true,
        title: 'Clear All Data',
        children: 'Are you sure you want to delete all transactions and categories? This is irreversible.',
        onConfirm: () => {
            clearAllDataFromDB();
            setTransactions([]);
            setCategories(INITIAL_CATEGORIES); // Reset to initial
            showToast('All data has been cleared.', 'success');
            setModalProps({isOpen: false, title: '', children: null});
            setCurrentPage('home');
        },
        confirmText: 'Clear Data',
        confirmVariant: 'danger'
    });
  };

  const closeModal = () => {
    setModalProps({ isOpen: false, title: '', children: null });
  };
  
  const handleTransactionSelect = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage stats={stats} transactions={sortedTransactions} onTransactionClick={handleTransactionSelect} />;
      case 'transactions':
        return <TransactionsPage 
          transactions={sortedTransactions} 
          addTransaction={addTransaction} 
          categories={categories}
          onTransactionClick={handleTransactionSelect}
          transactionDescriptions={transactionDescriptions}
          itemDescriptions={itemDescriptions}
          showToast={showToast}
        />;
      case 'reports':
        return <ReportsPage transactions={transactions} categories={categories} onTransactionClick={handleTransactionSelect} />;
      case 'settings':
        return <SettingsPage 
            categories={categories} 
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
            onClearAllData={handleClearAllData}
        />;
      default:
        return <HomePage stats={stats} transactions={sortedTransactions} onTransactionClick={handleTransactionSelect} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="p-4 pb-24 md:max-w-7xl md:mx-auto">
        {renderPage()}
      </main>
      <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <Modal {...modalProps} onClose={closeModal} />
      <Toast {...toastProps} onClose={() => setToastProps(prev => ({ ...prev, isVisible: false }))} />

      {/* Detail/Edit View Modal */}
      <Modal isOpen={!!selectedTransaction} onClose={() => setSelectedTransaction(null)} title="Transaction Details" hideFooter>
        {selectedTransaction && (
            <TransactionDetailView 
                transaction={selectedTransaction}
                onEdit={() => {
                   setModalProps({
                        isOpen: true,
                        title: "Edit Transaction",
                        children: <EditTransactionForm 
                            transaction={selectedTransaction}
                            onSave={updateTransaction}
                            onCancel={() => setModalProps({isOpen: false, title: '', children: null})}
                            categories={categories}
                        />,
                        hideFooter: true
                   });
                   setSelectedTransaction(null); // Close the detail view behind
                }}
                onDelete={handleDeleteRequest}
            />
        )}
      </Modal>
    </div>
  );
}