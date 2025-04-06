import type { Link as LinkType } from '../config/types';
import { Icon } from './Icon';

interface LinkProps {
  link: LinkType;
  displayMode: 'icon' | 'list';
}

export const Link = ({ link, displayMode }: LinkProps) => {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
        displayMode === 'icon' ? 'flex-col' : 'flex-row'
      }`}
    >
      <div className="flex-shrink-0">
        <Icon name={link.icon} size={displayMode === 'icon' ? 32 : 24} />
      </div>
      <span className="text-sm font-medium">{link.name}</span>
    </a>
  );
}; 