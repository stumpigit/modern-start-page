import { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface ContextSwitcherProps {
  contexts: Array<{ id: string; name: string }>;
  activeContext: string;
  onContextChange: (contextId: string) => void;
}

export default function ContextSwitcher({ contexts, activeContext, onContextChange }: ContextSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything until after client-side hydration
  if (!isMounted) {
    return null;
  }

  const activeContextName = contexts.find(c => c.id === activeContext)?.name || 'Select Context';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1 rounded bg-secondary-700/50 text-secondary-300 hover:bg-secondary-700"
      >
        <Icon name="Grid" size={20} />
        <span>{activeContextName}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-secondary-800 border border-secondary-700 rounded-lg p-2 w-48 shadow-lg">
          {contexts.map((context) => (
            <button
              key={context.id}
              onClick={() => {
                onContextChange(context.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded transition-colors duration-200 ${
                activeContext === context.id
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-secondary-300 hover:bg-secondary-700'
              }`}
            >
              {context.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 