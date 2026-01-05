
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, TransactionType, PaymentMethod, TransactionLineItem } from '../types';
import { PAYMENT_METHODS } from '../constants';
import { scanBillWithGemini, compressImage } from '../services/geminiService';

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
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  
  // Simple Mode State
  const [amount, setAmount] = useState('');
  
  // Shared State
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Online');
  
  // Advanced Mode State
  const [items, setItems] = useState<ItemState[]>([{ description: '', quantity: '1', unitPrice: '' }]);
  
  const [isScanning, setIsScanning] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Auto trigger scan if enabled
  useEffect(() => {
    if (autoScan) {
        // Small delay to ensure the modal/form is fully mounted
        const timer = setTimeout(() => {
            if (cameraInputRef.current) {
                cameraInputRef.current.click();
            }
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [autoScan]);

  // Calculate total for Advanced Mode
  const advancedTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0), 0);
  }, [items]);

  // Derived display total
  const displayTotal = mode === 'simple' ? (parseFloat(amount) || 0) : advancedTotal;

  const handleScan = async (file: File) => {
    setIsScanning(true);
    showToast("Analyzing bill with AI...", "success");
    try {
      // Use compressImage to ensure file size is manageable for mobile networks/memory
      const base64 = await compressImage(file);
      const scannedItems = await scanBillWithGemini(base64);
      
      if (scannedItems && scannedItems.length > 0) {
        setMode('advanced'); // Auto-switch to advanced mode
        setItems(scannedItems.map(item => ({
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice)
        })));
        if (scannedItems[0].description) {
          setDescription(`Bill: ${scannedItems[0].description}`);
        }
        showToast(`AI extracted ${scannedItems.length} items`, "success");
      } else {
        showToast("AI couldn't find items. Using simple mode.", "error");
      }
    } catch (error: any) {
        console.error(error);
        showToast("Scanning failed. Try a clearer photo.", "error");
    } finally {
      setIsScanning(false);
    }
  };

  const handleItemChange = (index: number, field: keyof ItemState, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { description: '', quantity: '1', unitPrice: '' }]);
  const removeItem = (index: number) => items.length > 1 && setItems(items.filter((_, i) => i !== index));

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!category) return showToast("Select a category", "error");
    
    const finalAmount = mode === 'simple' ? parseFloat(amount) : advancedTotal;

    if (isNaN(finalAmount) || finalAmount <= 0) {
        return showToast("Enter a valid amount", "error");
    }

    const lineItems: TransactionLineItem[] = mode === 'advanced' 
      ? items.map((item, idx) => ({
          id: idx.toString(),
          description: item.description || 'Item',
          quantity: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0
        }))
      : [{
          id: '0',
          description: description || 'Manual Entry',
          quantity: 1,
          unitPrice: finalAmount
        }];

    onSubmit({
      type,
      description: description || (mode === 'advanced' && items[0].description ? items[0].description : 'Manual Entry'),
      date,
      category,
      paymentMethod,
      items: lineItems
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-20">
        <button onClick={onCancel} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <h2 className="text-md font-extrabold text-brand-dark dark:text-white uppercase tracking-wider">
          New {type}
        </h2>
        <button type="button" onClick={(e) => handleSubmit(e)} className="text-emerald-500 font-extrabold text-sm uppercase tracking-widest hover:text-emerald-600">
          SAVE
        </button>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar pb-32">
        {/* Amount Display */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-8 pt-6 transition-all">
            <label className="block text-center text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest mb-4">
                {mode === 'simple' ? 'Amount (INR)' : 'Total Calculated (INR)'}
            </label>
            <div className="flex items-center justify-center gap-4">
                <span className="text-4xl font-bold text-slate-300 dark:text-slate-700">₹</span>
                {mode === 'simple' ? (
                    <div className="relative group flex items-center justify-center">
                        <input 
                            type="number" 
                            step="0.01" 
                            value={amount} 
                            onChange={(e) => setAmount(e.target.value)} 
                            className="text-6xl font-black bg-transparent outline-none text-brand-dark placeholder-slate-200 dark:text-white dark:placeholder-slate-800 text-center w-full max-w-[280px] caret-brand-primary" 
                            placeholder="0.00" 
                            autoFocus
                        />
                    </div>
                ) : (
                    <span className="text-6xl font-black text-brand-dark dark:text-white">
                        {advancedTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                )}
            </div>
            {mode === 'advanced' && (
                <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                    Sum of {items.length} items
                </p>
            )}
        </div>

        <div className="p-5 space-y-6">
            {/* Type Selector */}
            <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden p-0.5">
                <button 
                    onClick={() => setType('expense')} 
                    className={`flex-1 py-3.5 rounded-md text-[11px] font-black uppercase tracking-widest transition-all ${type === 'expense' ? 'bg-brand-dark text-white shadow-lg' : 'text-slate-400 dark:text-slate-600 bg-transparent'}`}
                >
                    Expense
                </button>
                <button 
                    onClick={() => setType('income')} 
                    className={`flex-1 py-3.5 rounded-md text-[11px] font-black uppercase tracking-widest transition-all ${type === 'income' ? 'bg-brand-dark text-white shadow-lg' : 'text-slate-400 dark:text-slate-600 bg-transparent'}`}
                >
                    Income
                </button>
            </div>

            {/* Standard Details Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">
                        {mode === 'advanced' ? 'Overall Description' : 'Description'}
                    </label>
                    <input 
                        type="text" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        placeholder={mode === 'advanced' ? "e.g. Weekly Grocery Run" : "e.g. Office Supplies"} 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-4 text-sm font-bold outline-none text-brand-dark dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700" 
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Category</label>
                    <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)} 
                        className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl p-4 text-sm font-bold outline-none appearance-none transition-colors ${!category ? 'border-red-300 dark:border-red-900 text-slate-400' : 'border-slate-100 dark:border-slate-800 text-brand-dark dark:text-white'}`}
                    >
                        <option value="">Select Category (Required)</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Date</label>
                    <input 
                        type="date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-4 text-sm font-bold outline-none text-brand-dark dark:text-white" 
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Payment Mode</label>
                    <div className="flex bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-1">
                        <button 
                            type="button"
                            onClick={() => setPaymentMethod('Cash')}
                            className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'Cash' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400'}`}
                        >
                            Cash
                        </button>
                        <button 
                            type="button"
                            onClick={() => setPaymentMethod('Online')}
                            className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'Online' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400'}`}
                        >
                            Online
                        </button>
                    </div>
                </div>
            </div>

            {/* Advanced Mode: Items List */}
            {mode === 'advanced' && (
                <div className="space-y-4 pt-2 animate-fade-in">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itemized Breakdown</label>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{items.length} Items</span>
                    </div>
                    <div className="space-y-3">
                        {items.map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={item.description} 
                                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)} 
                                    placeholder="Item name" 
                                    className="flex-grow text-xs font-bold bg-transparent outline-none dark:text-white" 
                                />
                                <button type="button" onClick={() => removeItem(idx)} className="text-slate-300 hover:text-rose-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg></button>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Qty</label>
                                    <input type="number" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 py-2 px-3 rounded-lg text-xs font-black outline-none dark:text-white" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Unit Price</label>
                                    <input type="number" value={item.unitPrice} onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 py-2 px-3 rounded-lg text-xs font-black outline-none text-right dark:text-white" />
                                </div>
                                <div className="text-right min-w-[70px]">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Total</label>
                                    <span className="text-xs font-black text-brand-dark dark:text-white">₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        ))}
                        <button 
                            type="button" 
                            onClick={addItem} 
                            className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-brand-primary hover:text-brand-primary transition-all"
                        >
                            + Add Item
                        </button>
                    </div>
                </div>
            )}

            {/* Scan Bill - Available in both modes, forces Advanced */}
            <div 
                onClick={() => cameraInputRef.current?.click()}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm relative overflow-hidden group"
            >
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-400 group-hover:text-brand-primary transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <div>
                    <h4 className="text-[11px] font-black text-brand-dark dark:text-white uppercase tracking-widest group-hover:text-brand-primary transition-colors">Scan Bill</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Auto-fill via AI (Switches to Advanced)</p>
                </div>
                {/* Changed from className="hidden" to opacity-0 to work in WebViews */}
                <input 
                    type="file" 
                    ref={cameraInputRef} 
                    className="absolute opacity-0 w-0 h-0 overflow-hidden" 
                    accept="image/*" 
                    capture="environment" 
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            handleScan(e.target.files[0]);
                        }
                        // Reset value to allow re-selection
                        e.target.value = '';
                    }} 
                />
                
                {isScanning && (
                    <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex items-center justify-center gap-3">
                         <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                         <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">Reading Receipt...</span>
                    </div>
                )}
            </div>

            {/* Mode Selector */}
            <div className="flex items-center justify-center gap-4 pb-2">
                <button 
                    onClick={() => setMode('simple')}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'simple' ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    Simple Mode
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-800"></div>
                <button 
                    onClick={() => setMode('advanced')}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'advanced' ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    Advanced Mode
                </button>
            </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-900 z-30">
          <button 
            type="button"
            onClick={(e) => handleSubmit(e)}
            className="w-full py-4 bg-brand-dark dark:bg-brand-primary text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Save {type} • ₹{displayTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </button>
      </div>
    </div>
  );
};

export default TransactionForm;
