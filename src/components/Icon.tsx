import * as LucideIcons from 'lucide-react';
import type { ComponentProps } from 'react';

interface IconProps extends ComponentProps<LucideIcons.LucideIcon> {
  name: string;
  size?: number;
  className?: string;
}

export const Icon = ({ name, size = 24, className = '', ...props }: IconProps) => {
  // Try to find the icon directly first
  let IconComponent = LucideIcons[name as keyof typeof LucideIcons] as React.ComponentType<ComponentProps<LucideIcons.LucideIcon>>;

  // If not found, try PascalCase version
  if (!IconComponent) {
    const pascalCaseName = name.charAt(0).toUpperCase() + name.slice(1);
    IconComponent = LucideIcons[pascalCaseName as keyof typeof LucideIcons] as React.ComponentType<ComponentProps<LucideIcons.LucideIcon>>;
  }

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <IconComponent
      size={size}
      className={`text-current ${className}`}
      {...props}
    />
  );
}; 