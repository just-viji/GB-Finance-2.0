import React from 'react';

interface InsightsPanelProps {
  onGetInsights: () => void;
  insights: string;
  isLoading: boolean;
  error: string | null;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ onGetInsights, insights, isLoading, error }) => {
  const formattedInsights = insights.split('* ').filter(s => s.trim() !== '').map((insight, index) => (
    <li key={index} className="flex items-start space-x-3">
      <svg className="flex-shrink-0 h-5 w-5 text-brand-primary mt-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <span>{insight.trim()}</span>
    </li>
  ));

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-brand-dark">Gemini Insights</h2>
      
      {error && <p className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

      {isLoading && (
        <div className="flex justify-center items-center py-8">
            <svg className="animate-spin h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
      )}

      {!isLoading && insights && (
        <ul className="space-y-3 text-brand-secondary">
          {formattedInsights}
        </ul>
      )}

       {!isLoading && !insights && !error && (
        <p className="text-brand-secondary">Click the button to get AI-powered financial insights based on your recent transactions.</p>
       )}
      
      <button
        onClick={onGetInsights}
        disabled={isLoading}
        className="mt-4 w-full bg-brand-primary text-white font-bold py-2 px-4 rounded-md hover:bg-brand-primary-hover transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
        {isLoading ? 'Analyzing...' : 'Get Insights'}
      </button>
    </div>
  );
};

export default InsightsPanel;