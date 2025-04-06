import { useState, useMemo, useEffect, memo } from 'react';
import type { Context, UserConfig, Link } from '../config/types';
import { Icon } from './Icon';

interface ContextManagerProps {
  initialConfig: UserConfig;
}

const LinkCard = memo(({ link }: { link: Link }) => {
  return (
    <a
      href={link.url.startsWith('http') ? link.url : `http://${link.url}`}
      className="flex items-center space-x-2 p-2 text-secondary-300 hover:text-primary-400 transition-colors duration-200 group"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon name={link.icon} size={20} />
      <span className="text-sm">
        {link.name}
      </span>
    </a>
  );
});

const CategorySection = memo(({ category, showBorders }: { category: any, showBorders: boolean }) => {
  return (
    <div className={`bg-secondary-800/50 rounded-lg p-6 ${showBorders ? 'border border-secondary-700' : ''}`}>
      <h2 className="text-xl font-semibold text-secondary-200 mb-6">{category.name}</h2>
      <div className="space-y-2">
        {category.links.map((link: Link) => (
          <LinkCard key={link.name} link={link} />
        ))}
      </div>
    </div>
  );
});

export default function ContextManager({ initialConfig }: ContextManagerProps) {
  const [config, setConfig] = useState<UserConfig>(initialConfig);
  const [activeContext, setActiveContext] = useState(initialConfig.activeContext);
  
  useEffect(() => {
    const handleConfigChange = (event: CustomEvent<UserConfig>) => {
      setConfig(event.detail);
      setActiveContext(event.detail.activeContext);
    };

    window.addEventListener('msp-config-change', handleConfigChange as EventListener);
    return () => {
      window.removeEventListener('msp-config-change', handleConfigChange as EventListener);
    };
  }, []);

  const currentContext = useMemo(() => 
    config.contexts.find(c => c.id === activeContext) || config.contexts[0],
    [config.contexts, activeContext]
  );

  if (!currentContext?.categories) {
    console.warn('No categories found in current context');
    return null;
  }

  return (
    <div className="flex justify-center w-full">
      <div 
        className="grid gap-6 category-grid max-w-7xl w-full px-4"
        style={{ 
          gridTemplateColumns: `repeat(${config.gridColumns}, minmax(0, 1fr))`,
          display: 'grid',
        }}
      >
        {currentContext.categories.map((category) => (
          <CategorySection 
            key={category.name} 
            category={category} 
            showBorders={config.showCategoryBorders} 
          />
        ))}
      </div>
    </div>
  );
} 