
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Transaction, TransactionType, PaymentMethod, TransactionLineItem } from '../types';
import { PAYMENT_METHODS } from '../constants';
import { calculateTotalAmount } from '../utils/transactionUtils';
import { scanBillLocally, scanBillWithGemini, blobToBase64 } from '../services/geminiService';

declare global {
  interface Window {
    // Aligned window.aistudio declaration with the expected environment type to resolve compiler conflicts.
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  onCancel?: () => void;
  categories: string[];
  transactionDescriptions: string[];
  itemDescriptions: string[];
  showToast: (message: string, type?: 'success' | 'error') => void;
  initialType?: TransactionType;
  autoScan?: boolean;
}

type ItemState = Omit<TransactionLineItem, 'id' | 'unitPrice' | 'quantity'> & { unitPrice: string; quantity: string; };

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, onCancel, categories, showToast, initialType = 'expense', autoScan = false }) => {
  const [type, setType] = useState<TransactionType>(initialType);
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Online');

  const [isItemized, setIsItemized] = useState(false);
  const [items, setItems] = useState<ItemState[]>([{ description: '', quantity: '1', unitPrice: '' }]);
  
  const [errors, setErrors] = useState<{
    amount?: boolean;
    category?: boolean;
    description?: boolean;
    items?: number[];
  }>({});

  const [isScanning, setIsScanning] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoScan) {
      const timer = setTimeout(() => {
        handleTriggerScan();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [autoScan]);

  const handleTriggerScan = async () => {
    try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await window.aistudio.openSelectKey();
        }
        cameraInputRef.current?.click();
    } catch (e) {
        console.error("Key selection bridge failed", e);
        cameraInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    showToast("Analyzing receipt with Gemini AI...", "success");

    try {
      const base64 = await blobToBase64(file);
      const scannedItems = await scanBillWithGemini(base64);
      
      if (scannedItems && scannedItems.length > 0) {
          setIsItemized(true);
          setItems(scannedItems.map(item => ({
              description: item.description,
              quantity: String(item.quantity),
              unitPrice: String(item.unitPrice)
          })));
          
          if (scannedItems[0].description) {
              setDescription(`Receipt: ${scannedItems[0].description}`);
          }
          
          showToast(`Extracted ${scannedItems.length} items.`, "success");
      } else {
          showToast("No items found. Trying local OCR...", "error");
          const localItems = await scanBillLocally(base64);
          if (localItems && localItems.length > 0) {
              setIsItemized(true);
              setItems(localItems.map(item => ({
                  description: item.description,
                  quantity: String(item.quantity),
                  unitPrice: String(item.unitPrice)
              })));
              showToast(`Extracted ${localItems.length} items via local OCR.`, "success");
          } else {
              showToast("OCR Failed. Please enter manually.", "error");
          }
      }
    } catch (error: any) {
        if (error.message === "API_KEY_INVALID") {
            showToast("Invalid API Key. Please re-select.", "error");
            await window.aistudio.openSelectKey();
        } else {
            showToast("Scanning failed.", "error");
        }
    } finally {
        setIsScanning(false);
        if (e.target) e.target.value = '';
    }
  };

  const handleItemChange = (index: number, field: keyof ItemState, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
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

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    let isValid = true;

    if (isItemized) {
      const invalidIndices: number[] = [];
      items.forEach((item, idx) => {
        if (!item.description.trim() || isNaN(parseFloat(item.unitPrice))) {
          invalidIndices.push(idx);
        }
      });
      if (invalidIndices.length > 0) {
        newErrors.items = invalidIndices;
        isValid = false;
      }
    } else {
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        newErrors.amount = true;
        isValid = false;
      }
    }

    if (!category) {
      newErrors.category = true;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    const lineItems: TransactionLineItem[] = isItemized 
      ? items.map((item, idx) => ({
          id: idx.toString(),
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice)
        }))
      : [{
          id: '0',
          description: description || 'General',
          quantity: 1,
          unitPrice: parseFloat(amount)
        }];

    onSubmit({
      type,
      description: description || (isItemized ? items[0].description : 'Manual Entry'),
      date,
      category,
      paymentMethod,
      items: lineItems
    });
  };

  const totalCalculated = useMemo(() => {
    if (isItemized) {
      return items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0), 0);
    }
    return parseFloat(amount) || 0;
  }, [items, isItemized, amount]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden">
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950 sticky top-0 z-10">
        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
          {isScanning ? 'Scanning Receipt...' : (type === 'income' ? 'Log Income' : 'Log Expense')}
        </h2>
        <button type="button" onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar p-6 space-y-6">
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
          <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${type === 'expense' ? 'bg-white dark:bg-slate-800 text-rose-600 shadow-sm' : 'text-slate-500'}`}>Expense</button>
          <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${type === 'income' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Income</button>
        </div>

        {!isItemized ? (
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">₹</span>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-full text-4xl font-black py-4 pl-10 pr-4 bg-slate-50 dark:bg-slate-900 border ${errors.amount ? 'border-rose-500' : 'border-slate-100 dark:border-slate-800'} rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-slate-900 dark:text-white`} placeholder="0.00" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
             <div className="flex items-center justify-between">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Line Items</label>
               <button type="button" onClick={() => setIsItemized(false)} className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Switch to Single</button>
             </div>
             <div className="space-y-3">
               {items.map((item, index) => (
                 <div key={index} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                   <div className="flex gap-2">
                      <input type="text" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} className="flex-grow bg-transparent text-sm font-bold outline-none placeholder-slate-400" placeholder="Description" />
                      <button type="button" onClick={() => removeItem(index)} className="text-slate-300 hover:text-rose-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
                   </div>
                   <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Qty</label>
                        <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="w-full bg-transparent text-sm font-black outline-none" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Price</label>
                        <input type="number" step="0.01" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} className="w-full bg-transparent text-sm font-black outline-none" />
                      </div>
                      <div className="text-right">
                        <label className="block text-[8px] font-bold text-slate-400 uppercase">Total</label>
                        <span className="text-sm font-black text-slate-900 dark:text-white">₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toLocaleString()}</span>
                      </div>
                   </div>
                 </div>
               ))}
               <button type="button" onClick={addItem} className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-brand-primary hover:text-brand-primary transition-all">+ Add Line Item</button>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.category ? 'border-rose-500' : 'border-slate-100 dark:border-slate-800'} rounded-xl p-3 text-sm font-bold outline-none text-slate-900 dark:text-white`}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Payment Method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-sm font-bold outline-none text-slate-900 dark:text-white">
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-sm font-bold outline-none text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Notes</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-sm font-bold outline-none text-slate-900 dark:text-white" placeholder="Optional details..." />
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex justify-between items-center px-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Total</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">₹{totalCalculated.toLocaleString()}</span>
        </div>
        
        <div className="flex gap-3">
            <button type="button" onClick={() => setIsItemized(!isItemized)} className="flex-1 py-4 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-all">
                {isItemized ? 'Merge to One' : 'Itemize Entry'}
            </button>
            <button type="submit" className="flex-[2] py-4 bg-brand-dark dark:bg-brand-primary text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">
                Finalize Entry
            </button>
        </div>
        
        <div className="hidden">
            <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" onChange={handleFileChange} />
        </div>
      </div>
    </form>
  );
};

export default TransactionForm;
