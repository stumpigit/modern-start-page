import type { Category as CategoryType } from '../config/types';
import { Link } from './Link';

interface CategoryProps {
  category: CategoryType;
  showBorders: boolean;
}

export const Category = ({ category, showBorders }: CategoryProps) => {
  return (
    <div
      className={`p-4 ${
        showBorders
          ? 'border border-gray-200 dark:border-gray-700 rounded-lg'
          : ''
      }`}
    >
      <h2 className="text-lg font-semibold mb-4">{category.name}</h2>
      <div
        className={`grid gap-4 ${
          category.displayMode === 'icon'
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
            : 'grid-cols-1'
        }`}
      >
        {category.links.map((link) => (
          <Link
            key={link.url}
            link={link}
            displayMode={category.displayMode}
          />
        ))}
      </div>
    </div>
  );
}; 