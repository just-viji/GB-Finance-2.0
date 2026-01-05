
import { GoogleGenAI, Type } from "@google/genai";
import { TransactionLineItem } from '../types';

export type ScannedItem = Omit<TransactionLineItem, 'id'>;

declare var Tesseract: any;

/**
 * Compresses and resizes an image file to ensure it fits within payload limits and WebView memory.
 * Converts to JPEG with 0.7 quality and max dimension of 1024px.
 */
export async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const elem = document.createElement('canvas');
        const maxWidth = 1024;
        const maxHeight = 1024;
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG at 0.7 quality
        const dataUrl = elem.toDataURL('image/jpeg', 0.7);
        // Remove the Data URL prefix to get raw base64
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Local OCR fallback using Tesseract.js
 */
export async function scanBillLocally(base64ImageData: string): Promise<ScannedItem[]> {
  try {
    if (typeof Tesseract === 'undefined') {
      throw new Error("Tesseract.js is not loaded.");
    }

    const worker = await Tesseract.createWorker('eng');
    const { data: { text } } = await worker.recognize(`data:image/jpeg;base64,${base64ImageData}`);
    await worker.terminate();

    const items: ScannedItem[] = [];
    const lines = text.split('\n');
    
    const ignoreKeywords = [
        'subtotal', 'tax', 'cash', 'change', 'visa', 'mastercard', 'due', 'balance', 
        'date', 'time', 'tel', 'fax', 'gst', 'thank', 'visit', 'again', 'invoice', 'bill no'
    ];

    const parsePrice = (str: string) => {
        const clean = str.replace(/[^0-9.,]/g, '');
        return parseFloat(clean.replace(/,/g, ''));
    };
    
    const cleanDesc = (text: string) => {
        let clean = text.trim();
        clean = clean.replace(/^\d+[\s.]+\s*/, '');
        clean = clean.replace(/[^a-zA-Z0-9\s%&.-]+$/g, '');
        return clean.trim();
    };

    for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine || cleanLine.length < 3) continue;

        const lowerLine = cleanLine.toLowerCase();
        
        if (ignoreKeywords.some(keyword => lowerLine.includes(keyword))) continue;
        if (lowerLine.startsWith('total') || lowerLine.includes(' total ')) continue;

        const numberRegex = /((?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?)/g;
        const matches = [...cleanLine.matchAll(numberRegex)];
        
        if (matches.length >= 1) {
            const lastNum = matches[matches.length - 1];
            const price = parsePrice(lastNum[0]);
            const description = cleanLine.substring(0, lastNum.index).trim();
            
            if (description && !isNaN(price) && price > 0) {
                 items.push({
                     description: cleanDesc(description),
                     quantity: 1,
                     unitPrice: parseFloat(price.toFixed(2))
                 });
            }
        }
    }
    return items;
  } catch (error) {
    console.error('Local OCR Error:', error);
    return [];
  }
}

/**
 * AI OCR using Gemini 3 Flash
 */
export async function scanBillWithGemini(base64ImageData: string): Promise<ScannedItem[]> {
  const apiKey = (process.env as any).API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64ImageData,
      },
    };
    const textPart = {
      text: "Analyze this bill/receipt image. Extract all individual line items. For each item, provide: 1. 'description' (string, e.g. 'Coffee'), 2. 'quantity' (number, e.g. 2), 3. 'unitPrice' (number, the price per single item). Do not include taxes or totals as items. If unit price isn't clear, use total price for that item with quantity 1. Return strictly JSON."
    };
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                },
                required: ["description", "quantity", "unitPrice"],
              }
            }
          },
          propertyOrdering: ["items"],
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("AI returned empty content");
    
    const result = JSON.parse(jsonText);
    return result.items || [];
  } catch (error: any) {
    console.error('Gemini Scanning Error:', error);
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("API_KEY_MISSING")) {
        throw error;
    }
    // Fallback to local OCR if Gemini fails for reasons other than API Key
    console.log("Attempting local OCR fallback...");
    return scanBillLocally(base64ImageData);
  }
}

/**
 * Chatbot assistant using Gemini 3 Flash
 */
export async function getChatbotResponse(history: any[], transactions: any[]): Promise<string> {
  const apiKey = (process.env as any).API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const systemPart = history.find(h => h.role === 'system');
    const messages = history.filter(h => h.role !== 'system');

    const context = `Context: User has ${transactions.length} transactions recorded. 
Data Summary: ${JSON.stringify(transactions.slice(0, 30).map(t => ({
        d: t.description,
        c: t.category,
        dt: t.date,
        v: t.items.reduce((s: number, i: any) => s + (i.quantity * i.unitPrice), 0)
    })))}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [{ text: context }] },
        ...messages
      ],
      config: {
        systemInstruction: systemPart?.parts[0]?.text || "You are a friendly financial assistant."
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    return "Something went wrong with the AI service.";
  }
}

// Kept for backward compatibility if needed, but implementation uses the new structure logic
export function blobToBase64(blob: Blob): Promise<string> {
  return compressImage(blob as File);
}
