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
      className="flex items-center space-x-2 p-2 sm:p-3 text-secondary-300 hover:text-primary-400 transition-colors duration-200 group rounded-md hover:bg-secondary-700/20"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon name={link.icon} size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
      <span className="text-sm sm:text-base truncate">
        {link.name}
      </span>
    </a>
  );
});

const CategorySection = memo(({ category, showBorders }: { category: any, showBorders: boolean }) => {
  return (
    <div className={`bg-secondary-200/90 rounded-lg p-4 sm:p-6 ${showBorders ? 'border border-secondary-200' : ''}`}>
      <h2 className="text-lg sm:text-xl font-semibold text-secondary-200 mb-4 sm:mb-6">{category.name}</h2>
      <div className="space-y-1 sm:space-y-2">
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

  // Calculate responsive grid columns based on screen size and config
  const getResponsiveGridColumns = () => {
    const baseColumns = config.gridColumns || 3;
    return {
      mobile: Math.min(1, baseColumns),
      tablet: Math.min(2, baseColumns),
      desktop: baseColumns
    };
  };

  const gridConfig = getResponsiveGridColumns();

  return (
    <div className="flex justify-center w-full">
      <div 
        className="grid gap-4 sm:gap-6 category-grid max-w-7xl w-full px-2 sm:px-4"
        style={{ 
          gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
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