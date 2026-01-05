
import React, { useState } from 'react';

interface CategoryManagerProps {
  categories: string[];
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onAddCategory, onDeleteCategory }) => {
  const [newCategory, setNewCategory] = useState('');

  const handleAdd = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <span key={cat} className="inline-flex items-center px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 group hover:border-brand-primary transition-all">
            {cat}
            <button
              onClick={() => onDeleteCategory(cat)}
              className="ml-3 text-slate-300 hover:text-brand-accent transition-colors"
              aria-label={`Remove ${cat}`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </span>
        ))}
      </div>
      
      <div className="flex gap-2 p-1 bg-slate-100/50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New Category Label"
          className="flex-grow bg-transparent text-slate-900 dark:text-white px-4 py-2 text-xs font-bold outline-none placeholder-slate-400 uppercase tracking-widest"
        />
        <button
          onClick={handleAdd}
          disabled={!newCategory.trim()}
          className="px-5 py-2 bg-brand-dark dark:bg-brand-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50 transition-all active:scale-95"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default CategoryManager;
