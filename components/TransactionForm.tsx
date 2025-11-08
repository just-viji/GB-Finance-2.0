import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, PaymentMethod, TransactionLineItem } from '../types';
import { PAYMENT_METHODS } from '../constants';
import { calculateTotalAmount } from '../utils/transactionUtils';

interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  categories: string[];
  onAddCategory: (category: string) => void;
  transactionDescriptions: string[];
  itemDescriptions: string[];
}

type ItemState = Omit<TransactionLineItem, 'id' | 'unitPrice'> & { unitPrice: string };

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, categories, onAddCategory, transactionDescriptions, itemDescriptions }) => {
  const [type, setType] = useState<TransactionType>('sale');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Online');
  const [items, setItems] = useState<ItemState[]>([{ description: '', quantity: 1, unitPrice: '' }]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // When categories list updates (e.g., new category added), ensure `category` state is valid
  useEffect(() => {
    if (!categories.includes(category)) {
      setCategory(categories[0] || '');
    }
  }, [categories, category]);
  
  const grandTotal = useMemo(() => {
    const numericItems = items.map(i => ({...i, id: '', unitPrice: parseFloat(i.unitPrice) || 0, quantity: i.quantity || 0}));
    return calculateTotalAmount(numericItems);
  }, [items]);

  const handleItemChange = (index: number, field: keyof ItemState, value: string | number) => {
    const newItems = [...items];
    const item = newItems[index];
    (item[field] as any) = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleAddCategory = () => {
    const trimmedCategory = newCategoryName.trim();
    if (trimmedCategory) {
        onAddCategory(trimmedCategory);
        setCategory(trimmedCategory);
        setNewCategoryName('');
        setIsAddingCategory(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasInvalidItem = items.some(i => !i.description || (parseFloat(i.unitPrice) || 0) <= 0 || (i.quantity || 0) <= 0);
    if (!description || items.length === 0 || hasInvalidItem) {
      alert('Please provide a main description and ensure all items have a description, a quantity greater than 0, and a price greater than 0.');
      return;
    }

    const finalItems = items.map(item => ({
      id: '', // will be set in App.tsx
      description: item.description,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice)
    }));
    
    onSubmit({
      type,
      description,
      category: type === 'sale' ? 'Sale' : category,
      paymentMethod,
      items: finalItems,
    });

    setDescription('');
    setCategory(categories[0]);
    setPaymentMethod('Online');
    setItems([{ description: '', quantity: 1, unitPrice: '' }]);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-6 text-brand-dark">Add New Transaction</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <datalist id="transaction-descriptions-list">
            {transactionDescriptions.map(desc => <option key={desc} value={desc} />)}
        </datalist>
        <datalist id="item-descriptions-list">
            {itemDescriptions.map(desc => <option key={desc} value={desc} />)}
        </datalist>

        <fieldset>
          <legend className="text-sm font-medium text-brand-secondary mb-2">Transaction Type</legend>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button type="button" onClick={() => setType('sale')} className={`w-1/2 p-2 rounded-md text-sm font-medium transition-colors ${type === 'sale' ? 'bg-brand-primary text-white shadow' : 'text-brand-secondary hover:bg-gray-200'}`}>Sale</button>
            <button type="button" onClick={() => setType('expense')} className={`w-1/2 p-2 rounded-md text-sm font-medium transition-colors ${type === 'expense' ? 'bg-brand-accent text-white shadow' : 'text-brand-secondary hover:bg-gray-200'}`}>Expense</button>
          </div>
        </fieldset>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-brand-secondary mb-1">Overall Description</label>
          <input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={type === 'sale' ? 'e.g., Project for Acme Corp' : 'e.g., Office supply run'} className="w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary" list="transaction-descriptions-list"/>
        </div>
        
        {/* Line Items */}
        <fieldset>
             <legend className="text-sm font-medium text-brand-secondary mb-2">Items</legend>
            <div className="space-y-3">
                {items.map((item, index) => {
                    const lineTotal = (parseFloat(item.unitPrice) || 0) * (item.quantity || 0);
                    return (
                        <div key={index} className="grid grid-cols-12 gap-2 p-2 bg-gray-50 rounded-lg items-center">
                            <input type="text" placeholder="Item Description" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} className="col-span-12 sm:col-span-5 bg-white border border-gray-300 text-brand-dark rounded-md p-2 text-sm focus:ring-brand-primary focus:border-brand-primary" list="item-descriptions-list" />
                            <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value, 10))} className="col-span-3 sm:col-span-2 bg-white border border-gray-300 text-brand-dark rounded-md p-2 text-sm focus:ring-brand-primary focus:border-brand-primary" min="1" />
                            <input type="number" placeholder="Price" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} className="col-span-4 sm:col-span-2 bg-white border border-gray-300 text-brand-dark rounded-md p-2 text-sm focus:ring-brand-primary focus:border-brand-primary" min="0" step="0.01"/>
                            <div className="col-span-3 sm:col-span-2 text-right pr-1">
                                <p className="text-sm font-medium text-brand-dark truncate">
                                    {lineTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                </p>
                            </div>
                            <button type="button" onClick={() => removeItem(index)} disabled={items.length <= 1} className="col-span-2 sm:col-span-1 flex justify-center items-center text-red-500 hover:bg-red-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                        </div>
                    );
                })}
                <button type="button" onClick={addItem} className="w-full text-sm font-semibold text-brand-primary hover:text-brand-primary-hover py-1">+ Add Item</button>
            </div>
        </fieldset>

        <div className="flex justify-end font-bold text-lg text-brand-dark pr-2">
            Total: {grandTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {type === 'expense' && (
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-brand-secondary mb-1">Category</label>
                  {!isAddingCategory ? (
                    <div className="flex gap-2">
                      <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="flex-grow w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary">
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <button type="button" onClick={() => setIsAddingCategory(true)} title="Add new category" className="p-2 bg-gray-200 text-brand-dark rounded-md font-semibold hover:bg-gray-300 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-100 p-3 rounded-md border border-gray-200">
                        <p className="text-sm font-medium text-brand-secondary mb-2">Add New Category</p>
                        <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={newCategoryName} 
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              placeholder="e.g., Office Rent"
                              autoFocus
                              className="flex-grow w-full bg-white border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
                            />
                            <button type="button" onClick={handleAddCategory} className="px-4 py-2 bg-brand-primary text-white rounded-md text-sm font-semibold hover:bg-brand-primary-hover">Add</button>
                            <button type="button" onClick={() => setIsAddingCategory(false)} className="px-4 py-2 bg-white border border-gray-300 text-brand-secondary rounded-md text-sm font-semibold hover:bg-gray-100">Cancel</button>
                        </div>
                    </div>
                  )}
                </div>
            )}
             <div className={type === 'sale' ? 'sm:col-span-2' : ''}>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-brand-secondary mb-1">Payment Method</label>
                <select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary">
                    {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                </select>
            </div>
        </div>
        <button type="submit" className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-md hover:bg-brand-primary-hover transition-colors shadow-sm hover:shadow-md">Add Transaction</button>
      </form>
    </div>
  );
};

export default TransactionForm;