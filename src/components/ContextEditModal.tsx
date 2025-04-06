import { useState } from 'react';
import type { Context } from '../config/types';
import { Icon } from './Icon';

interface ContextEditModalProps {
  context: Context;
  onSave: (context: Context) => void;
  onCancel: () => void;
  className?: string;
}

export default function ContextEditModal({ context, onSave, onCancel, className = '' }: ContextEditModalProps) {
  const [name, setName] = useState(context.name);
  const [id, setId] = useState(context.id || generateId(name));
  const [categories, setCategories] = useState(context.categories);

  function generateId(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('ContextEditModal: Submitting form with data:', {
      id: id || generateId(name),
      name,
      categories: categories || []
    });
    onSave({
      ...context,
      id: id || generateId(name),
      name,
      categories: categories || []
    });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!context.id) {
      setId(generateId(newName));
    }
  };

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] ${className}`}>
      <div className="bg-secondary-900 rounded-lg p-6 w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-4 border-b border-secondary-700">
          <h2 className="text-xl font-semibold text-secondary-200">
            {context.id ? 'Edit Context' : 'New Context'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-secondary-700 transition-colors text-secondary-400"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-secondary-100 mb-2">
              Context Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={handleNameChange}
              className="w-full px-3 py-2 bg-black border border-secondary-600 rounded-lg text-secondary-100 focus:outline-none focus:border-primary-500"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded bg-secondary-700 text-secondary-100 hover:bg-secondary-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-primary-500 text-white hover:bg-primary-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 