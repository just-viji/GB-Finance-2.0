
import { GoogleGenAI, Type } from "@google/genai";
import { TransactionLineItem } from '../types';

export type ScannedItem = Omit<TransactionLineItem, 'id'>;

declare var Tesseract: any;

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

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64String = result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
