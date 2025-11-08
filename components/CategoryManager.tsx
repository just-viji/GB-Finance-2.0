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
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-brand-dark">Manage Categories</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
          className="flex-grow w-full bg-gray-50 border border-gray-300 text-brand-dark rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-brand-primary text-white rounded-md text-sm font-semibold hover:bg-brand-primary-hover disabled:bg-gray-400"
        >
          Add
        </button>
      </div>
      <div className="max-h-40 overflow-y-auto pr-2">
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li key={cat} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
              <span className="text-sm text-brand-dark">{cat}</span>
              <button
                onClick={() => onDeleteCategory(cat)}
                className="p-1 rounded-full hover:bg-red-100 text-red-500"
                aria-label={`Delete ${cat}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CategoryManager;
