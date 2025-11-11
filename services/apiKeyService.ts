const GEMINI_API_KEY = 'gemini-api-key';

export const getGeminiApiKey = (): string | null => {
  return localStorage.getItem(GEMINI_API_KEY);
};

export const setGeminiApiKey = (key: string): void => {
  localStorage.setItem(GEMINI_API_KEY, key);
};

export const removeGeminiApiKey = (): void => {
  localStorage.removeItem(GEMINI_API_KEY);
};
