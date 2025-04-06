import { type UserConfig } from '../config/types';
import ThemeSwitcher from './ThemeSwitcher';
import ContextSwitcher from './ContextSwitcher';
import SettingsButton from './SettingsButton';
import { Icon } from './Icon';

interface NavigationProps {
  config: UserConfig;
  onConfigChange: (newConfig: UserConfig) => Promise<void>;
}

export default function Navigation({ config, onConfigChange }: NavigationProps) {
  const handleContextChange = async (contextId: string) => {
    const newConfig = { ...config, activeContext: contextId };
    try {
      await onConfigChange(newConfig);
    } catch (error) {
      console.error('Error updating context:', error);
    }
  };

  return (
    <nav className="fixed top-4 right-4 flex items-center space-x-2">
      <ThemeSwitcher />
      <ContextSwitcher
        contexts={config.contexts}
        activeContext={config.activeContext}
        onContextChange={handleContextChange}
      />
      <button
        onClick={() => onConfigChange({ ...config, showSearchBar: !config.showSearchBar })}
        className="flex items-center space-x-2 px-3 py-1 rounded bg-secondary-700/50 text-secondary-300 hover:bg-secondary-700"
      >
        <Icon name="Search" size={20} />
        <span>Search</span>
      </button>
      <SettingsButton config={config} onConfigChange={onConfigChange} />
    </nav>
  );
} 