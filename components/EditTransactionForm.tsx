
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionLineItem } from '../types';
import { PAYMENT_METHODS } from '../constants';
import { calculateTotalAmount } from '../utils/transactionUtils';

// Types specific to the form state
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

    const toInputDateString = (isoString: string): string => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'date') {
            const [year, month, day] = value.split('-').map(Number);
            // We set it to noon local time to avoid timezone boundary issues.
            const newDate = new Date(year, month - 1, day, 12, 0, 0);
            setEditedTransaction(prev => ({ ...prev, date: newDate.toISOString() }));
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
                    <input type="date" name="date" value={toInputDateString(editedTransaction.date)} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary" />
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
                <div>
                  <label className="text-sm font-medium text-brand-secondary mb-1 block">Category</label>
                  <select name="category" value={editedTransaction.category} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary">
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
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

export default EditTransactionForm;
