import type { PluginManifest } from './types';
import { calendarPlugin } from './widgets/calendar';
import { iframePlugin } from './widgets/iframe';
import { searchPlugin } from './widgets/search';

export const plugins: PluginManifest[] = [
  searchPlugin,
  calendarPlugin,
  iframePlugin,
];

export type { PluginManifest } from './types';

