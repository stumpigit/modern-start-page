import { useState } from 'react';
import type { Category, Link } from '../config/types';
import { Icon } from './Icon';

interface CategoryEditModalProps {
  category?: Category;
  onSave: (category: Category) => void;
  onClose: () => void;
}

export default function CategoryEditModal({ category, onSave, onClose }: CategoryEditModalProps) {
  const [name, setName] = useState(category?.name || '');
  const [displayMode, setDisplayMode] = useState<'icon' | 'list'>(category?.displayMode || 'list');
  const [links, setLinks] = useState<Link[]>(category?.links || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      displayMode,
      links,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-secondary-900 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-secondary-200">
            {category ? 'Edit Category' : 'New Category'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-secondary-700 transition-colors text-secondary-400"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-secondary-800 border border-secondary-700 rounded-md text-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-300 mb-1">
              Display Mode
            </label>
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as 'icon' | 'list')}
              className="w-full px-3 py-2 bg-secondary-800 border border-secondary-700 rounded-md text-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="list">List</option>
              <option value="icon">Icon</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary-300 hover:text-secondary-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 