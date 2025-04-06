import { themes, type Theme } from '../data/themes';

interface ThemeSelectorProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  className?: string;
}

export default function ThemeSelector({ currentTheme, onThemeChange, className = '' }: ThemeSelectorProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
      {themes.map((theme) => (
        <button
          key={theme.name}
          onClick={() => onThemeChange(theme)}
          className={`flex flex-col items-center p-4 rounded-lg border transition-all duration-200 ${
            currentTheme.name === theme.name
              ? 'bg-primary-500/20 border-primary-500 text-primary-400'
              : 'bg-secondary-700/50 border-secondary-700 text-secondary-300 hover:border-primary-500 hover:text-primary-400'
          }`}
        >
          {/* Theme Preview */}
          <div className="w-full h-20 rounded-md mb-3 overflow-hidden grid grid-cols-2 gap-px">
            {Object.entries(theme.colors.primary).slice(3, 7).map(([key, value]) => (
              <div key={key} style={{ backgroundColor: value }} className="first:rounded-tl-md last:rounded-br-md" />
            ))}
          </div>
          <span className="text-sm font-medium">{theme.name}</span>
        </button>
      ))}
    </div>
  );
} 