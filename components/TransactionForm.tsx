import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Transaction, TransactionType, PaymentMethod, TransactionLineItem } from '../types';
import { PAYMENT_METHODS } from '../constants';
import { calculateTotalAmount } from '../utils/transactionUtils';
import { scanBillWithGemini, blobToBase64 } from '../services/geminiService';


interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  categories: string[];
  transactionDescriptions: string[];
  itemDescriptions: string[];
  showToast: (message: string, type?: 'success' | 'error') => void;
}

type ItemState = Omit<TransactionLineItem, 'id' | 'unitPrice' | 'quantity'> & { unitPrice: string; quantity: string; };

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, categories, transactionDescriptions, itemDescriptions, showToast }) => {
  const [type, setType] = useState<TransactionType>('sale');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Online');
  const [items, setItems] = useState<ItemState[]>([{ description: '', quantity: '1', unitPrice: '' }]);
  const [isScanning, setIsScanning] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // When categories list updates (e.g., deleted category), ensure `category` state is valid
  useEffect(() => {
    if (category && !categories.includes(category)) {
      setCategory('');
    }
  }, [categories, category]);
  
  const grandTotal = useMemo(() => {
    const numericItems = items.map(i => ({...i, id: '', unitPrice: parseFloat(i.unitPrice) || 0, quantity: parseFloat(i.quantity) || 0}));
    return calculateTotalAmount(numericItems);
  }, [items]);

  const handleItemChange = (index: number, field: keyof ItemState, value: string) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: '1', unitPrice: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasInvalidItem = items.some(i => !i.description || (parseFloat(i.unitPrice) || 0) <= 0 || (parseFloat(i.quantity) || 0) <= 0);
    if (!description || items.length === 0 || hasInvalidItem) {
      alert('Please provide a main description and ensure all items have a description, a quantity greater than 0, and a price greater than 0.');
      return;
    }

    if (type === 'expense' && !category) {
      alert('Please select a category for the expense.');
      return;
    }

    const finalItems = items.map(item => ({
      id: '', // will be set in App.tsx
      description: item.description,
      quantity: parseFloat(item.quantity),
      unitPrice: parseFloat(item.unitPrice)
    }));
    
    const [year, month, day] = date.split('-').map(Number);
    // We set it to noon local time to avoid timezone boundary issues.
    const transactionDate = new Date(year, month - 1, day, 12, 0, 0);
    
    onSubmit({
      type,
      description,
      date: transactionDate.toISOString(),
      category: type === 'sale' ? 'Sale' : category,
      paymentMethod,
      items: finalItems,
    });

    setDescription('');
    setDate(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    setCategory('');
    setPaymentMethod('Online');
    setItems([{ description: '', quantity: '1', unitPrice: '' }]);
  };
  
  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleUploadClick = () => {
    uploadInputRef.current?.click();
  };


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const base64Image = await blobToBase64(file);
      const scannedItems = await scanBillWithGemini(base64Image);

      if (scannedItems && scannedItems.length > 0) {
        const newItems: ItemState[] = scannedItems.map(item => ({
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
        }));
        setItems(newItems);
        showToast('Bill scanned successfully!', 'success');
      } else {
        showToast('Could not find any items on the bill.', 'error');
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      showToast(errorMessage, 'error');
    } finally {
      setIsScanning(false);
      if (event.target) {
        event.target.value = '';
      }
    }
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

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-3">
                <label htmlFor="description" className="block text-sm font-medium text-brand-secondary mb-1">Overall Description</label>
                <input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={type === 'sale' ? 'e.g., Room booking for Mr. Smith' : 'e.g., Purchase of fresh produce'} className="w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary" list="transaction-descriptions-list"/>
            </div>
            <div className="md:col-span-2">
                <label htmlFor="date" className="block text-sm font-medium text-brand-secondary mb-1">Date</label>
                <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary" />
            </div>
        </div>
        
        {/* Line Items */}
        <fieldset>
             <div className="flex justify-between items-center mb-2">
                <legend className="text-sm font-medium text-brand-secondary">Items</legend>
                {type === 'expense' && (
                  <div className="flex items-center gap-2">
                    {isScanning ? (
                      <div className="flex items-center gap-2 text-sm font-semibold text-brand-primary" aria-live="polite">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Scanning...
                      </div>
                    ) : (
                      <>
                        <button 
                          type="button" 
                          onClick={handleCameraClick}
                          className="p-2 text-brand-primary rounded-full hover:bg-brand-primary/10 transition-colors"
                          aria-label="Scan bill with camera"
                          title="Scan bill with camera"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 6a2 2 0 012-2h1.172a2 2 0 011.414.586l.828.828A2 2 0 008.828 6H11.172a2 2 0 001.414-.586l.828-.828A2 2 0 0114.828 4H16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                            <path fillRule="evenodd" d="M10 14a4 4 0 100-8 4 4 0 000 8zm0-2a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button 
                          type="button" 
                          onClick={handleUploadClick}
                          className="p-2 text-brand-primary rounded-full hover:bg-brand-primary/10 transition-colors"
                          aria-label="Upload bill from device"
                          title="Upload bill from device"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                )}
             </div>
            <div className="space-y-3">
                {items.map((item, index) => {
                    const lineTotal = (parseFloat(item.unitPrice) || 0) * (parseFloat(item.quantity) || 0);
                    return (
                        <div key={index} className="grid grid-cols-12 gap-2 p-2 bg-gray-50 rounded-lg items-center">
                            <input type="text" placeholder="Item Description" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} className="col-span-12 sm:col-span-5 bg-white border border-gray-300 text-brand-dark rounded-md p-2 text-sm focus:ring-brand-primary focus:border-brand-primary" list="item-descriptions-list" />
                            <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="col-span-3 sm:col-span-2 bg-white border border-gray-300 text-brand-dark rounded-md p-2 text-sm focus:ring-brand-primary focus:border-brand-primary" min="0.01" step="any" />
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

        <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            capture="environment"
        />
        <input
            type="file"
            ref={uploadInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
        />

        <div className="flex justify-end font-bold text-lg text-brand-dark pr-2">
            Total: {grandTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {type === 'expense' && (
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-brand-secondary mb-1">Category</label>
                  <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary">
                    <option value="" disabled>Select a category</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
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