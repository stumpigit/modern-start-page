import type { UserConfig } from '../config/types';

interface GridLayoutSelectorProps {
  currentColumns: number;
  onColumnsChange: (columns: number) => void;
  className?: string;
}

export default function GridLayoutSelector({ 
  currentColumns, 
  onColumnsChange, 
  className = '' 
}: GridLayoutSelectorProps) {
  const layouts = [
    { columns: 1, label: 'Single Column' },
    { columns: 2, label: 'Two Columns' },
    { columns: 3, label: 'Three Columns' },
    { columns: 4, label: 'Four Columns' },
    { columns: 5, label: 'Five Columns' }
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 ${className}`}>
      {layouts.map((layout) => (
        <button
          key={layout.columns}
          onClick={() => onColumnsChange(layout.columns)}
          className={`flex flex-col items-center p-4 rounded-lg border transition-all duration-200 ${
            currentColumns === layout.columns
              ? 'bg-primary-500/20 border-primary-500 text-primary-400'
              : 'bg-secondary-700/50 border-secondary-700 text-secondary-300 hover:border-primary-500 hover:text-primary-400'
          }`}
        >
          {/* Grid Preview */}
          <div className="w-full h-20 rounded-md mb-3 overflow-hidden">
            <div className={`grid gap-1 h-full`} style={{ gridTemplateColumns: `repeat(${layout.columns}, 1fr)` }}>
              {Array.from({ length: layout.columns * 2 }).map((_, i) => (
                <div 
                  key={i}
                  className="bg-secondary-600 rounded-sm"
                />
              ))}
            </div>
          </div>
          <span className="text-sm font-medium">{layout.label}</span>
        </button>
      ))}
    </div>
  );
} 