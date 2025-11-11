import { GoogleGenAI, Type } from "@google/genai";
import { TransactionLineItem } from '../types';
import { getGeminiApiKey } from './apiKeyService';

export type ScannedItem = Omit<TransactionLineItem, 'id'>;

export async function scanBillWithGemini(base64ImageData: string): Promise<ScannedItem[]> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key not configured. Please add it in the Settings page.");
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
      text: "Analyze the receipt image and extract all line items. For each item, provide its description, quantity, and unit price. Ignore taxes, totals, discounts, or any other information that is not a distinct purchased item. If you cannot determine a value, use a sensible default (e.g., quantity 1)."
    };
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              description: "A list of items found on the receipt.",
              items: {
                type: Type.OBJECT,
                properties: {
                  description: {
                    type: Type.STRING,
                    description: "The name or description of the item.",
                  },
                  quantity: {
                    type: Type.NUMBER,
                    description: "The quantity of the item purchased. Default to 1 if not specified.",
                  },
                  unitPrice: {
                    type: Type.NUMBER,
                    description: "The price of a single unit of the item.",
                  },
                },
                required: ["description", "quantity", "unitPrice"],
              }
            }
          },
          required: ["items"]
        }
      }
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    if (result.items && Array.isArray(result.items)) {
      // Validate the items structure to prevent malformed data from crashing the app
      return result.items
        .filter(item => item && typeof item.description === 'string' && typeof item.quantity === 'number' && typeof item.unitPrice === 'number')
        .map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }));
    }

    return [];

  } catch (error) {
    console.error('Error scanning bill with Gemini:', error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            throw new Error('The provided Gemini API Key is not valid. Please check your configuration.');
        }
        throw new Error(`AI scan failed. Reason: ${error.message}`);
    }
    throw new Error('Failed to analyze the bill image due to an unknown error.');
  }
}


export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // result is a data URL: "data:image/jpeg;base64,..."
      // We only need the base64 part
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
