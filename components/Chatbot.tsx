import React, { useState, useRef, useEffect } from 'react';
import { Transaction } from '../types';
import { getChatbotResponse } from '../services/geminiService';
import { Content } from '@google/genai';

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, transactions }) => {
  const [show, setShow] = useState(false);
  const [messages, setMessages] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const systemInstruction: Content = {
    role: "system",
    parts: [{text: `You are 'GB Finance Helper', a friendly AI assistant for the GB Finance 2.0 app. Your goal is to help users understand their financial data by answering their questions.
- You can understand and reply in English and Tanglish (Tamil written in English script). If the user asks in Tanglish, reply in Tanglish.
- Use the provided tools to find the information.
- The current date is ${new Date().toLocaleDateString('en-CA')}. Use this for relative date queries like 'last month' or 'this week'.
- When presenting financial numbers, format them clearly using Indian Rupee format (e.g., ₹1,23,456).
- If you don't know the answer or cannot find the data, say so politely. Do not make up data.
- Keep your answers concise and easy to understand.`}]
  };

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      if (messages.length === 0) {
        // Greet the user on first open
        setMessages([{ role: "model", parts: [{text: "Hello! I'm your financial assistant. How can I help you analyze your sales and expenses today?"}]}]);
      }
    } else {
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const userMessage = inputValue.trim();
    if (!userMessage || isLoading) return;

    const newMessages: Content[] = [...messages, { role: 'user', parts: [{text: userMessage }] }];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const history = [systemInstruction, ...newMessages];
      const responseText = await getChatbotResponse(history, transactions);
      setMessages(prev => [...prev, { role: 'model', parts: [{text: responseText }]}]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', parts: [{text: "Sorry, I'm having trouble connecting right now." }]}]);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!show) return null;

  return (
    <div 
        className={`fixed bottom-0 right-0 z-50 chatbot-enter-active ${isOpen ? '' : 'chatbot-exit-active'}`}
        aria-modal="true" role="dialog"
    >
        <div className="flex flex-col h-[70vh] w-[90vw] max-w-md max-h-[500px] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl m-0 md:m-8 border border-gray-200">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl">
                <h2 className="text-lg font-bold text-brand-dark">GB Finance Helper</h2>
                <button onClick={onClose} className="p-2 text-brand-secondary rounded-full hover:bg-gray-200" aria-label="Close chat">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-sm rounded-2xl px-4 py-2 whitespace-pre-wrap ${msg.role === 'user' ? 'bg-brand-primary text-white rounded-br-none' : 'bg-gray-200 text-brand-dark rounded-bl-none'}`}>
                            {msg.parts[0].text}
                        </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-200 text-brand-dark rounded-2xl rounded-bl-none px-4 py-2 flex items-center gap-2">
                           <div className="h-2 w-2 bg-brand-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                           <div className="h-2 w-2 bg-brand-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                           <div className="h-2 w-2 bg-brand-secondary rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t bg-white md:rounded-b-xl">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask about your finances..."
                        className="flex-1 w-full bg-gray-100 border-gray-300 text-brand-dark rounded-full py-2 px-4 focus:ring-brand-primary focus:border-brand-primary"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !inputValue} className="bg-brand-primary text-white rounded-full p-2 disabled:bg-gray-400 hover:bg-brand-primary-hover transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default Chatbot;