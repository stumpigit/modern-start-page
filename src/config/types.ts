export interface Link {
  name: string;
  url: string;
  icon: string;
}

export interface Category {
  name: string;
  displayMode: 'icon' | 'list';
  links: Link[];
}

export interface Context {
  id: string;
  name: string;
  categories: Category[];
}

export interface WidgetSettings {
  weather: {
    enabled: boolean;
    useCelsius: boolean;
  };
  clock: {
    enabled: boolean;
    showSeconds: boolean;
  };
  iframe: {
    enabled: boolean;
    url: string;
  };
  calendar: {
    enabled: boolean;
    icsUrl: string;
  };
}

export interface UserConfig {
  contexts: Context[];
  activeContext: string;
  theme: string;
  gridColumns: number;
  displayMode: 'icon' | 'list';
  showCategoryBorders: boolean;
  showSearchBar: boolean;
  widgets: WidgetSettings;
  user: string;
}

declare global {
  interface Window {
    mspConfig: UserConfig;
    onConfigChange: (newConfig: UserConfig) => Promise<void>;
  }
}

export interface ConfigStore {
  getConfig(): Promise<UserConfig>;
  saveConfig(config: UserConfig): Promise<void>;
  initialize(): Promise<void>;
} 
