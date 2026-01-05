
import React, { useState, useEffect, useRef } from 'react';
import { Transaction } from '../types';

declare var jsQR: any;

interface ScanToPayProps {
    onCancel: () => void;
    onSave: (transaction: Omit<Transaction, 'id'>) => void;
    categories: string[];
}

const ScanToPay: React.FC<ScanToPayProps> = ({ onCancel, onSave, categories }) => {
    const [step, setStep] = useState<'SCANNING' | 'DETAILS'>('SCANNING');
    const [videoError, setVideoError] = useState<string>('');
    const [scannedData, setScannedData] = useState<{ vpa: string; name: string; raw: string } | null>(null);
    const [showHelp, setShowHelp] = useState(false);
    const [copied, setCopied] = useState(false);
    
    // Form State
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const startCamera = async () => {
        setVideoError('');
        try {
            const constraints: MediaStreamConstraints = {
                video: { facingMode: "environment" }
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute("playsinline", "true"); 
                await videoRef.current.play();
                requestRef.current = requestAnimationFrame(tick);
            }
        } catch (err: any) {
            setVideoError("Camera access denied or unavailable.");
        }
    };

    useEffect(() => {
        if (step === 'SCANNING') startCamera();
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (videoRef.current?.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        };
    }, [step]);

    const tick = () => {
        if (videoRef.current?.readyState === 4) {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                if (ctx) {
                    canvas.width = videoRef.current.videoWidth;
                    canvas.height = videoRef.current.videoHeight;
                    ctx.drawImage(videoRef.current, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    if (code && handleQrCode(code.data)) return;
                }
            }
        }
        requestRef.current = requestAnimationFrame(tick);
    };

    const handleQrCode = (data: string): boolean => {
        if (data.includes('upi://pay')) {
            try {
                const url = new URL(data);
                const pa = url.searchParams.get('pa');
                const pn = url.searchParams.get('pn');
                const am = url.searchParams.get('am');

                if (pa) {
                    setScannedData({ vpa: pa, name: pn || pa, raw: data });
                    if (am) setAmount(am);
                    setDescription(pn ? `Payment to ${decodeURIComponent(pn)}` : `Payment to ${pa}`);
                    setStep('DETAILS');
                    return true;
                }
            } catch (e) { console.error(e); }
        }
        return false;
    };

    const handleGalleryImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    if (code) {
                        handleQrCode(code.data);
                    } else {
                        alert("No UPI QR code found in this image.");
                    }
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const copyVpa = () => {
        if (scannedData) {
            navigator.clipboard.writeText(scannedData.vpa);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const saveTransaction = (skipRedirect: boolean = false) => {
        if (!amount || parseFloat(amount) <= 0 || !category || !scannedData) return;
        
        setIsProcessing(true);
        const cleanAmount = parseFloat(amount).toFixed(2);
        const note = description || 'Payment';

        if (!skipRedirect) {
            let upiLink = scannedData.raw;
            if (!upiLink.includes('am=')) {
                upiLink += `&am=${cleanAmount}&cu=INR`;
            }
            window.location.href = upiLink;
        }

        setTimeout(() => {
            onSave({
                type: 'expense',
                description: note,
                date: new Date().toISOString(),
                category: category,
                paymentMethod: 'Online',
                items: [{ id: '', description: note, quantity: 1, unitPrice: parseFloat(amount) }]
            });
            setTimeout(() => { onCancel(); }, 1000);
        }, 500);
    };

    if (step === 'SCANNING') {
        return (
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
                <div className="flex-grow flex flex-col items-center justify-center p-6 space-y-8">
                    <div className="text-center space-y-1">
                        <h2 className="text-xl font-black text-brand-dark dark:text-white uppercase tracking-tight">QR Scanner</h2>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Position the UPI QR code within frame</p>
                    </div>

                    <div className="relative w-full max-w-[280px] aspect-square bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800">
                        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoPlay />
                        <canvas ref={canvasRef} className="hidden" />
                        
                        {/* Overlay Frame */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-brand-primary rounded-tl-xl"></div>
                            <div className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-brand-primary rounded-tr-xl"></div>
                            <div className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-brand-primary rounded-bl-xl"></div>
                            <div className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-brand-primary rounded-br-xl"></div>
                            
                            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-brand-primary/50 animate-[scan_2s_infinite]"></div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full max-w-[280px]">
                        <button 
                            onClick={() => galleryInputRef.current?.click()}
                            className="w-full py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Import from Gallery</span>
                        </button>
                        
                        <input 
                            type="file" 
                            ref={galleryInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleGalleryImport} 
                        />

                        <button 
                            onClick={onCancel}
                            className="w-full py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-rose-500 transition-colors"
                        >
                            Close Scanner
                        </button>
                    </div>
                </div>
                
                {videoError && (
                    <div className="p-4 m-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 rounded-xl text-center">
                        <p className="text-xs font-bold text-rose-600">{videoError}</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-2 h-full flex flex-col no-scrollbar">
            <div className="bg-brand-dark p-6 rounded-2xl text-white shadow-lg text-center relative">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold">{scannedData?.name.charAt(0).toUpperCase()}</span>
                </div>
                <h3 className="text-lg font-bold truncate px-4">{scannedData?.name}</h3>
                <div className="flex items-center justify-center gap-2 mt-1">
                    <p className="text-logo-mint text-[10px] font-mono">{scannedData?.vpa}</p>
                    <button onClick={copyVpa} className="text-white/40 hover:text-white transition-colors">
                        {copied ? 
                            <span className="text-[9px] font-black text-green-400 uppercase">Copied</span> : 
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                        }
                    </button>
                </div>
            </div>

            <div className="text-center">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Amount to Pay</label>
                 <div className="relative inline-block w-full max-w-[200px]">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-black text-gray-300">₹</span>
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full text-5xl font-black py-2 px-8 bg-transparent border-b-2 border-gray-100 focus:border-brand-primary outline-none text-center text-brand-dark"
                        placeholder="0"
                        disabled={isProcessing}
                    />
                 </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-brand-primary outline-none" disabled={isProcessing}>
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-brand-primary outline-none" placeholder="Note (Optional)" disabled={isProcessing} />
                </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-wider">Banking Limits Info</span>
                    <button onClick={() => setShowHelp(!showHelp)} className="text-[10px] font-bold text-red-700 underline uppercase">
                        Why it fails?
                    </button>
                </div>
                <p className="text-[11px] text-red-700/80 leading-relaxed font-medium">
                    Banks like <strong>SBI</strong> often block "Deep Links" from apps for security. If the bank app shows an error, please scan directly in GPay and use <strong>"Log Only"</strong> here.
                </p>
                {showHelp && (
                    <div className="mt-3 pt-3 border-t border-red-200 animate-fade-in space-y-2">
                        <p className="text-[10px] text-red-800">1. Banks trust GPay's own camera more than a link from a browser/app.</p>
                        <p className="text-[10px] text-red-800">2. High-value payments are often restricted on first-time VPA interactions.</p>
                        <p className="text-[10px] text-red-800">3. <strong>Solution:</strong> Copy the VPA above, pay in GPay, and click "Log Only" here.</p>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3 pb-safe mt-auto">
                <button
                    onClick={() => saveTransaction(false)}
                    disabled={isProcessing}
                    className="w-full bg-brand-dark text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-[0.98] flex items-center justify-center gap-3 disabled:bg-gray-400"
                >
                     {isProcessing ? 'Processing...' : 'Pay via UPI App'}
                </button>
                
                <div className="flex gap-3">
                    <button
                        onClick={() => saveTransaction(true)}
                        disabled={isProcessing}
                        className="flex-1 px-4 py-3 border-2 border-brand-primary text-brand-primary rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 disabled:opacity-50"
                    >
                        Log Only
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-500 font-bold text-[10px] uppercase tracking-widest"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScanToPay;
