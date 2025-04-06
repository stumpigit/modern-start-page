import { type UserConfig } from '../config/types';
import ThemeSwitcher from './ThemeSwitcher';
import ContextSwitcher from './ContextSwitcher';
import SettingsButton from './SettingsButton';

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
      <SettingsButton config={config} onConfigChange={onConfigChange} />
    </nav>
  );
} 