import type { UserConfig } from './types';
import { defaultConfig } from './defaultConfig';
import fs from 'fs/promises';
import path from 'path';

class ConfigStore {
  private config: UserConfig;
  private configPath: string;

  constructor(user?: string) {
    this.config = defaultConfig;
    if (user) this.configPath = process.env.CONFIG_PATH + '/config_'+user+'.json' || './data/config'+user+'.json';
    else this.configPath = process.env.CONFIG_PATH + '/config.json' || './data/config.json';
  }

  async getConfig(): Promise<UserConfig> {
    return this.config;
  }

  async saveConfig(newConfig: UserConfig): Promise<void> {
    this.config = newConfig;
    try {
      // Ensure the directory exists
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });
      // Write the config to file
      await fs.writeFile(this.configPath, JSON.stringify(newConfig, null, 2));
    } catch (error) {
      console.error('Error saving config to file:', error);
      throw error;
    }
  }

  async initialize(): Promise<void> {
    try {
      // Try to read the config file
      const fileContent = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(fileContent);
    } catch (error: any) {
      // If file doesn't exist, create it with default config
      if (error.code === 'ENOENT') {
        console.log('No config file found, creating with default config');
        await this.saveConfig(defaultConfig);
      } else {
        console.error('Error reading config file:', error);
        throw error;
      }
    }
  }
}

export const initializeConfig = async (user?: string) => {
  const store = new ConfigStore(user);
  await store.initialize();
  return store;
}; 