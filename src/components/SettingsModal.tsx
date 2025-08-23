import { useState, useRef, useEffect } from 'react';
import type { UserConfig, Context, Category, WidgetSettings } from '../config/types';
import { themes, type Theme } from '../data/themes';
import ContextEditModal from './ContextEditModal';
import BookmarkEditModal from './BookmarkEditModal';
import ThemeSelector from './ThemeSelector';
import GridLayoutSelector from './GridLayoutSelector';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import { Icon } from './Icon';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Declare the window.onConfigChange type
declare global {
  interface Window {
    onConfigChange: (newConfig: UserConfig) => Promise<void>;
  }
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: UserConfig;
  onConfigChange: (newConfig: UserConfig) => Promise<void>;
}

type Tab = 'contexts' | 'bookmarks' | 'appearance' | 'backup' | 'widgets' | 'about';

// Add this new component for sortable items
function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center justify-between p-3 bg-secondary-700/50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div 
            className="cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <Icon name="GripVertical" size={16} className="text-secondary-400" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function SettingsModal({ isOpen, onClose, config, onConfigChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('contexts');
  const [editingContext, setEditingContext] = useState<Context | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<Category | null>(null);
  const [selectedContextId, setSelectedContextId] = useState(config.activeContext);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isWarning: boolean;
    action: 'delete' | 'import' | null;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isWarning: false,
    action: null,
    onConfirm: () => {},
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLogout = () => {
    const redirectTo = window.location.pathname + window.location.search;
    window.location.href = `/api/logout?redirectTo=${encodeURIComponent(redirectTo)}`;
  };

  const handleConfigUpdate = async (newConfig: UserConfig) => {
    console.log('SettingsModal: Starting config update with:', newConfig);
    try {
      await onConfigChange(newConfig);
      console.log('SettingsModal: Config update successful');
      setToast({ message: 'Configuration updated successfully', type: 'success' });
    } catch (error) {
      console.error('Error updating config:', error);
      setToast({ message: 'Failed to update configuration', type: 'error' });
    }
  };

  const handleContextSave = async (context: Context) => {
    console.log('SettingsModal: Starting context save with:', context);
    const newConfig = { ...config };
    const index = newConfig.contexts.findIndex(c => c.id === context.id);
    if (index >= 0) {
      newConfig.contexts[index] = context;
    } else {
      newConfig.contexts.push(context);
    }
    try {
      await handleConfigUpdate(newConfig);
      setToast({ message: 'Context saved successfully', type: 'success' });
    } catch (error) {
      console.error('Error saving context:', error);
      setToast({ message: 'Failed to save context', type: 'error' });
    }
    setEditingContext(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = config.contexts.findIndex(context => context.id === active.id);
      const newIndex = config.contexts.findIndex(context => context.id === over.id);
      
      const newContexts = arrayMove(config.contexts, oldIndex, newIndex);
      const newConfig = { ...config, contexts: newContexts };
      handleConfigUpdate(newConfig);
    }
  };

  const handleContextEdit = (context: Context) => {
    console.log('Editing context:', context);
    setEditingContext(context);
  };

  const handleContextDelete = async (contextId: string) => {
    console.log('Deleting context:', contextId);
    const contextToDelete = config.contexts.find(c => c.id === contextId);
    if (!contextToDelete) return;

    // Prevent deletion if it's the last context
    if (config.contexts.length <= 1) {
      setConfirmDialog({ 
        isOpen: true, 
        title: "Cannot Delete Context",
        message: "You must have at least one context. Please create a new context before deleting this one.",
        isWarning: true,
        action: null,
        onConfirm: () => {},
      });
      return;
    }

    // Show confirmation dialog for deletion
    setConfirmDialog({ 
      isOpen: true, 
      title: "Delete Context",
      message: `Are you sure you want to delete the context "${contextToDelete.name}"? This action cannot be undone.`,
      isWarning: false,
      action: 'delete',
      onConfirm: async () => {
        const newConfig = {
          ...config,
          contexts: config.contexts.filter(c => c.id !== contextId)
        };
        
        if (newConfig.activeContext === contextId) {
          newConfig.activeContext = newConfig.contexts[0]?.id || '';
        }

        try {
          await onConfigChange(newConfig);
          setToast({ message: 'Context deleted successfully', type: 'success' });
        } catch (error) {
          console.error('Error deleting context:', error);
          setToast({ message: 'Failed to delete context', type: 'error' });
        }

        setConfirmDialog({
          isOpen: false,
          title: '',
          message: '',
          isWarning: false,
          action: null,
          onConfirm: () => {},
        });
      }
    });
  };

  const handleBookmarkSave = async (category: Category, contextId: string) => {
    console.log('SettingsModal: Starting bookmark save with:', { category, contextId });
    const newConfig = { ...config };
    const contextIndex = newConfig.contexts.findIndex(c => c.id === selectedContextId);
    
    if (contextIndex >= 0) {
      const context = newConfig.contexts[contextIndex];
      
      // If we're editing an existing category, find it by its original name
      const originalCategory = editingBookmark?.name ? 
        context.categories.find(c => c.name === editingBookmark.name) : null;
      
      if (originalCategory) {
        // Update existing category
        const categoryIndex = context.categories.findIndex(c => c.name === originalCategory.name);
        if (categoryIndex >= 0) {
          context.categories[categoryIndex] = category;
        }
      } else {
        // Add new category
        context.categories.push(category);
      }
      
      // Update the context in the config
      newConfig.contexts[contextIndex] = context;
      
      try {
        // Use server-side discovery when proxy is enabled
        {
          const cal0 = (calendar as any).caldav || { url: '', username: '', password: '', useProxy: false };
          if (cal0.useProxy) {
            const baseUrl0: string = cal0.url || '';
            if (!baseUrl0) {
              setDiscoverError('Enter a CalDAV base URL first');
              return;
            }
            const res0 = await fetch('/api/caldav', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'discover', url: baseUrl0, username: cal0.username, password: cal0.password }),
            });
            if (!res0.ok) throw new Error(`Discovery failed (${res0.status})`);
            const data0 = await res0.json();
            const items0 = (data0?.calendars as Array<{ href: string; name: string }>) || [];
            if (items0.length === 0) setDiscoverError('No calendar collections found');
            setDiscoveredCalendars(items0);
            if (items0.length) setSelectedDiscovered(items0[0].href);
            return;
          }
        }
        console.log('SettingsModal: Attempting to save config:', newConfig);
        await handleConfigUpdate(newConfig);
        setToast({ message: 'Bookmark updated successfully', type: 'success' });
      } catch (error) {
        console.error('Error updating bookmark:', error);
        setToast({ message: 'Failed to update bookmark', type: 'error' });
      }
    } else {
      console.error('Context not found for ID:', selectedContextId);
      setToast({ message: 'Context not found', type: 'error' });
    }
    
    setEditingBookmark(null);
  };

  const handleExportConfig = () => {
    const configString = JSON.stringify(config, null, 2);
    const blob = new Blob([configString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'msp-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    setConfirmDialog({ 
      isOpen: true, 
      title: "Import Configuration",
      message: "Importing a new configuration will override your current settings. Are you sure you want to continue?",
      isWarning: false,
      action: 'import',
      onConfirm: () => {
        fileInputRef.current?.click();
        setConfirmDialog({
          isOpen: false,
          title: '',
          message: '',
          isWarning: false,
          action: null,
          onConfirm: () => {},
        });
      }
    });
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        // Basic validation of the imported config
        if (
          importedConfig &&
          Array.isArray(importedConfig.contexts) &&
          typeof importedConfig.activeContext === 'string'
        ) {
          handleConfigUpdate(importedConfig);
          setToast({ message: 'Configuration imported successfully', type: 'success' });
        } else {
          setToast({ message: 'Invalid configuration file format', type: 'error' });
        }
      } catch (error) {
        setToast({ message: 'Error reading configuration file', type: 'error' });
      }
    };
    reader.readAsText(file);
    // Reset the file input
    event.target.value = '';
  };

  const handleThemeChange = (theme: Theme) => {
    // Apply theme colors to CSS variables
    const root = document.documentElement;
    Object.entries(theme.colors.primary).forEach(([key, value]) => {
      root.style.setProperty(`--primary-${key}`, value);
    });
    Object.entries(theme.colors.secondary).forEach(([key, value]) => {
      root.style.setProperty(`--secondary-${key}`, value);
    });
    root.style.setProperty('--background', theme.colors.background);
    
    // Update config
    handleConfigUpdate({ ...config, theme: theme.name });
  };

  const currentTheme = themes.find(t => t.name === config.theme) || themes[0];

  const handleDisplayModeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newConfig = {
      ...config,
      displayMode: e.target.value as 'icon' | 'list'
    };
    await handleConfigUpdate(newConfig);
  };

  const handleSearchBarToggle = async (enabled: boolean) => {
    console.log('Search bar toggle:', enabled);
    console.log('Current config:', config);
    const newConfig = {
      ...config,
      showSearchBar: enabled
    };
    console.log('New config:', newConfig);
    try {
      await handleConfigUpdate(newConfig);
      console.log('Search bar toggle successful');
    } catch (error) {
      console.error('Error toggling search bar:', error);
    }
  };

  const AppearanceSettings = () => {
    const currentTheme = themes.find(t => t.name === config.theme) || themes[0];

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-secondary-200">Theme</h3>
          <ThemeSelector
            currentTheme={currentTheme}
            onThemeChange={handleThemeChange}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-secondary-200">Grid Layout</h3>
          <GridLayoutSelector
            currentColumns={config.gridColumns}
            onColumnsChange={(columns) => handleConfigUpdate({ ...config, gridColumns: columns })}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-secondary-200">Category Borders</h3>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showCategoryBorders}
                onChange={(e) => handleConfigUpdate({ ...config, showCategoryBorders: e.target.checked })}
                className="form-checkbox h-5 w-5 text-primary-500 rounded border-secondary-600 focus:ring-primary-500"
              />
              <span className="text-secondary-300">Show category borders</span>
            </label>
          </div>
        </div>
      </div>
    );
  };

  const handleBookmarkEdit = (category: Category) => {
    console.log('Editing bookmark:', category);
    setEditingBookmark(category);
  };

  const handleBookmarkDelete = (context: Context, categoryName: string) => {
    console.log('Deleting bookmark:', categoryName);
    const categoryToDelete = context.categories.find(c => c.name === categoryName);
    if (!categoryToDelete) return;

    setConfirmDialog({ 
      isOpen: true, 
      title: "Delete Bookmark",
      message: `Are you sure you want to delete the bookmark category "${categoryName}"? This action cannot be undone.`,
      isWarning: false,
      action: 'delete',
      onConfirm: async () => {
        const newContext = {
          ...context,
          categories: context.categories.filter(
            cat => cat.name !== categoryName
          )
        };
        const newConfig = {
          ...config,
          contexts: config.contexts.map(c => 
            c.id === context.id ? newContext : c
          )
        };

        try {
          await onConfigChange(newConfig);
          setToast({ message: 'Bookmark deleted successfully', type: 'success' });
        } catch (error) {
          console.error('Error deleting bookmark:', error);
          setToast({ message: 'Failed to delete bookmark', type: 'error' });
        }

        setConfirmDialog({
          isOpen: false,
          title: '',
          message: '',
          isWarning: false,
          action: null,
          onConfirm: () => {},
        });
      }
    });
  };

  const handleBookmarkDragEnd = (event: DragEndEvent, contextId: string) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const context = config.contexts.find(c => c.id === contextId);
      if (!context) return;

      const oldIndex = context.categories.findIndex(category => category.name === active.id);
      const newIndex = context.categories.findIndex(category => category.name === over.id);
      
      const newCategories = arrayMove(context.categories, oldIndex, newIndex);
      const newContext = { ...context, categories: newCategories };
      const newConfig = {
        ...config,
        contexts: config.contexts.map(c => 
          c.id === contextId ? newContext : c
        )
      };
      handleConfigUpdate(newConfig);
    }
  };

  const handleWidgetToggle = async (widget: keyof WidgetSettings, enabled: boolean) => {
    // Ensure widgets property exists
    const widgets = config.widgets || {
      weather: {
        enabled: false,
        useCelsius: false
      },
      clock: {
        enabled: false,
        showSeconds: false
      },
      iframe: {
        enabled: false,
        url: ''
      },
      calendar: {
        enabled: false,
        icsUrl: '',
        source: 'ics',
        caldav: { url: '', username: '', password: '' },
      }
    } as WidgetSettings;

    const newConfig = {
      ...config,
      widgets: {
        ...widgets,
        [widget]: {
          ...widgets[widget],
          enabled
        }
      }
    };

    try {
      await handleConfigUpdate(newConfig);
    } catch (error) {
      console.error('Error toggling widget:', error);
      setToast({ message: 'Failed to toggle widget', type: 'error' });
    }
  };

  const handleTemperatureUnitToggle = async (useCelsius: boolean) => {
    // Ensure widgets property exists
    const widgets = config.widgets || {
      weather: {
        enabled: false,
        useCelsius: false
      },
      clock: {
        enabled: false,
        showSeconds: false
      },
      iframe: {
        enabled: false,
        url: ''
      },
      calendar: {
        enabled: false,
        icsUrl: '',
        source: 'ics',
        caldav: { url: '', username: '', password: '' },
      }
    } as WidgetSettings;

    const newConfig = {
      ...config,
      widgets: {
        ...widgets,
        weather: {
          ...widgets.weather,
          useCelsius
        },
        clock: {
          ...widgets.clock,
          useCelsius
        }
      }
    };

    try {
      await handleConfigUpdate(newConfig);
    } catch (error) {
      console.error('Error toggling temperature unit:', error);
      setToast({ message: 'Failed to toggle temperature unit', type: 'error' });
    }
  };

  const handleClockSecondsToggle = async (showSeconds: boolean) => {
    // Ensure widgets property exists
    const widgets = config.widgets || {
      weather: {
        enabled: false,
        useCelsius: false
      },
      clock: {
        enabled: false,
        showSeconds: false
      },
      iframe: {
        enabled: false,
        url: ''
      },
      calendar: {
        enabled: false,
        icsUrl: '',
        source: 'ics',
        caldav: { url: '', username: '', password: '' },
      }
    } as WidgetSettings;

    const newConfig = {
      ...config,
      widgets: {
        ...widgets,
        clock: {
          ...widgets.clock,
          showSeconds
        }
      }
    };

    try {
      await handleConfigUpdate(newConfig);
    } catch (error) {
      console.error('Error toggling clock seconds:', error);
      setToast({ message: 'Failed to toggle clock seconds', type: 'error' });
    }
  };

  const handleIframeUrlChange = async (url: string) => {
    const widgets = config.widgets || {
      weather: { enabled: false, useCelsius: false },
      clock: { enabled: false, showSeconds: false },
      iframe: { enabled: false, url: '' },
      calendar: { enabled: false, icsUrl: '', source: 'ics', caldav: { url: '', username: '', password: '' } },
    } as WidgetSettings;

    const newConfig = {
      ...config,
      widgets: {
        ...widgets,
        iframe: {
          ...widgets.iframe,
          url
        }
      }
    };

    try {
      await handleConfigUpdate(newConfig);
    } catch (error) {
      console.error('Error updating iframe URL:', error);
      setToast({ message: 'Failed to update iframe URL', type: 'error' });
    }
  };

  const handleCalendarSourceChange = async (source: 'ics' | 'caldav') => {
    const widgets = (config.widgets || {
      weather: { enabled: false, useCelsius: false },
      clock: { enabled: false, showSeconds: false },
      iframe: { enabled: false, url: '' },
      calendar: { enabled: false, icsUrl: '', source: 'ics', caldav: { url: '', username: '', password: '' } },
    }) as WidgetSettings;

    const newConfig = {
      ...config,
      widgets: {
        ...widgets,
        calendar: {
          enabled: widgets.calendar?.enabled ?? false,
          icsUrl: widgets.calendar?.icsUrl || '',
          source,
          caldav: widgets.calendar?.caldav || { url: '', username: '', password: '' },
        },
      },
    };

    try {
      await handleConfigUpdate(newConfig);
    } catch (error) {
      console.error('Error updating calendar source:', error);
      setToast({ message: 'Failed to update calendar source', type: 'error' });
    }
  };

  const handleCalDavChange = async (field: 'url' | 'username' | 'password' | 'useProxy', value: string | boolean) => {
    const widgets = (config.widgets || {
      weather: { enabled: false, useCelsius: false },
      clock: { enabled: false, showSeconds: false },
      iframe: { enabled: false, url: '' },
      calendar: { enabled: false, icsUrl: '', source: 'ics', caldav: { url: '', username: '', password: '' } },
    }) as WidgetSettings;

    const currentCal = widgets.calendar?.caldav || { url: '', username: '', password: '', useProxy: false };
    const newConfig = {
      ...config,
      widgets: {
        ...widgets,
        calendar: {
          enabled: widgets.calendar?.enabled ?? false,
          icsUrl: widgets.calendar?.icsUrl || '',
          source: (widgets.calendar as any)?.source || 'ics',
          caldav: { ...currentCal, [field]: value as any },
        },
      },
    };

    try {
      await handleConfigUpdate(newConfig);
    } catch (error) {
      console.error('Error updating CalDAV settings:', error);
      setToast({ message: 'Failed to update CalDAV settings', type: 'error' });
    }
  };

  const handleCalendarUrlChange = async (icsUrl: string) => {
    const widgets = config.widgets || {
      weather: { enabled: false, useCelsius: false },
      clock: { enabled: false, showSeconds: false },
      iframe: { enabled: false, url: '' },
      calendar: { enabled: false, icsUrl: '', source: 'ics', caldav: { url: '', username: '', password: '' } },
    } as WidgetSettings;

    const newConfig = {
      ...config,
      widgets: {
        ...widgets,
        calendar: {
          ...widgets.calendar,
          icsUrl,
        },
      },
    };

    try {
      await handleConfigUpdate(newConfig);
    } catch (error) {
      console.error('Error updating calendar URL:', error);
      setToast({ message: 'Failed to update calendar URL', type: 'error' });
    }
  };

  const WidgetsSettings = () => {
    const [calendarUrlInput, setCalendarUrlInput] = useState('');
    const [discovering, setDiscovering] = useState(false);
    const [discoverError, setDiscoverError] = useState<string | null>(null);
    const [discoveredCalendars, setDiscoveredCalendars] = useState<Array<{ href: string; name: string }>>([]);
    const [selectedDiscovered, setSelectedDiscovered] = useState<string>('');
    const [testing, setTesting] = useState(false);
    const [testMessage, setTestMessage] = useState<string | null>(null);
    // Ensure widgets property exists with all widget settings
    const widgets = config.widgets || {
      weather: {
        enabled: false,
        useCelsius: false
      },
      clock: {
        enabled: false,
        showSeconds: false
      },
      iframe: {
        enabled: false,
        url: ''
      },
      calendar: {
        enabled: false,
        icsUrl: '',
        source: 'ics',
        caldav: { url: '', username: '', password: '' },
      }
    } as WidgetSettings;

    const iframe = widgets.iframe || {
      enabled: false,
      url: ''
    };

    const calendar = widgets.calendar || {
      enabled: false,
      icsUrl: '',
      source: 'ics' as const,
      caldav: { url: '', username: '', password: '' },
    };

    useEffect(() => {
      setCalendarUrlInput(calendar.icsUrl || '');
    }, [calendar.icsUrl]);

    const discoverCalendars = async () => {
      setDiscovering(true);
      setDiscoverError(null);
      setDiscoveredCalendars([]);
      setSelectedDiscovered('');
      try {
        const cal = (calendar as any).caldav || { url: '', username: '', password: '' };
        const baseUrl: string = cal.url || '';
        if (!baseUrl) {
          setDiscoverError('Enter a CalDAV base URL first');
          return;
        }
        const auth = typeof btoa !== 'undefined' && cal.username
          ? 'Basic ' + btoa(`${cal.username}:${cal.password || ''}`)
          : '';

        const propfind = async (url: string, depth: '0' | '1') => {
          const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<d:propfind xmlns:d=\"DAV:\" xmlns:c=\"urn:ietf:params:xml:ns:caldav\">` +
            `<d:prop>` +
            `<d:current-user-principal/>` +
            `<c:calendar-home-set/>` +
            `<d:displayname/>` +
            `<d:resourcetype/>` +
            `</d:prop>` +
            `</d:propfind>`;
          const res = await fetch(url, {
            method: 'PROPFIND',
            headers: {
              'Content-Type': 'application/xml; charset=utf-8',
              'Depth': depth,
              ...(auth ? { 'Authorization': auth } : {}),
            },
            body,
          } as RequestInit);
          if (!res.ok) throw new Error(`PROPFIND ${depth} failed (${res.status})`);
          const text = await res.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'application/xml');
          const parserErr = doc.getElementsByTagName('parsererror');
          if (parserErr && parserErr.length) throw new Error('Failed to parse PROPFIND response');
          return doc;
        };

        const getHref = (parent: Element | Document, local: string, ns?: string) => {
          const els = ns
            ? (parent as Document).getElementsByTagNameNS(ns, local)
            : (parent as Document).getElementsByTagName(local);
          if (els && els.length) {
            const hrefs = (els[0] as Element).getElementsByTagNameNS('DAV:', 'href');
            if (hrefs && hrefs.length) return hrefs[0].textContent || '';
          }
          return '';
        };

        // Step 1: Try to get calendar-home-set directly on given URL
        const doc0 = await propfind(baseUrl, '0');
        let home = getHref(doc0, 'calendar-home-set', 'urn:ietf:params:xml:ns:caldav');
        if (!home) {
          // Try via current-user-principal
          const principalHref = getHref(doc0, 'current-user-principal', 'DAV:')
            || getHref(doc0, 'current-user-principal');
          if (!principalHref) {
            home = baseUrl;
          } else {
            const principalUrl = new URL(principalHref, baseUrl).toString();
            const docP = await propfind(principalUrl, '0');
            home = getHref(docP, 'calendar-home-set', 'urn:ietf:params:xml:ns:caldav');
            if (!home) home = principalUrl;
          }
        }

        const homeUrl = new URL(home, baseUrl).toString();

        // Step 2: Depth:1 list calendars in home
        const doc1 = await propfind(homeUrl, '1');
        const responses = doc1.getElementsByTagNameNS('DAV:', 'response');
        const items: Array<{ href: string; name: string }> = [];
        for (let i = 0; i < responses.length; i++) {
          const resp = responses[i];
          const hrefEl = resp.getElementsByTagNameNS('DAV:', 'href')[0];
          if (!hrefEl) continue;
          const href = new URL(hrefEl.textContent || '', homeUrl).toString();
          const displaynameEl = resp.getElementsByTagNameNS('DAV:', 'displayname')[0];
          const displayname = displaynameEl?.textContent || href;
          // Check resourcetype contains caldav:calendar
          let isCalendar = false;
          const resType = resp.getElementsByTagNameNS('DAV:', 'resourcetype')[0];
          if (resType) {
            const calEls = resType.getElementsByTagNameNS('urn:ietf:params:xml:ns:caldav', 'calendar');
            if (calEls && calEls.length) isCalendar = true;
          }
          if (isCalendar) items.push({ href, name: displayname });
        }

        if (items.length === 0) {
          setDiscoverError('No calendar collections found');
        }
        setDiscoveredCalendars(items);
        if (items.length) setSelectedDiscovered(items[0].href);
      } catch (e: any) {
        setDiscoverError(e?.message || 'Discovery failed');
      } finally {
        setDiscovering(false);
      }
    };

    const applyDiscovered = async () => {
      if (!selectedDiscovered) return;
      await handleCalDavChange('url', selectedDiscovered);
    };

    const testCalDavConnection = async () => {
      setTesting(true);
      setTestMessage(null);
      try {
        const cal = (calendar as any).caldav || { url: '', username: '', password: '', useProxy: false };
        const baseUrl: string = cal.url || '';
        if (!baseUrl) {
          setTestMessage('Please enter a CalDAV URL first');
          return;
        }
        if (cal.useProxy) {
          const res = await fetch('/api/caldav', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'discover', url: baseUrl, username: cal.username, password: cal.password }),
          });
          let data: any = null;
          try { data = await res.json(); } catch {}
          if (!res.ok) {
            const err = data?.error || `Failed (${res.status})`;
            const auth = data?.details?.wwwAuthenticate ? ` Auth: ${data.details.wwwAuthenticate}` : '';
            const hint = data?.details?.hint ? ` Hint: ${data.details.hint}` : '';
            setTestMessage(`Connection failed: ${err}${auth}${hint}`);
            return;
          }
          const count = Array.isArray(data?.calendars) ? data.calendars.length : 0;
          const guess = data?.guessHome ? ` Base: ${data.guessHome}` : '';
          setTestMessage(`Connection successful. Found ${count} calendar(s).${guess}`);
        } else {
          // Direct browser PROPFIND Depth:0
          const auth = typeof btoa !== 'undefined' && (calendar as any).caldav?.username
            ? 'Basic ' + btoa(`${(calendar as any).caldav?.username}:${(calendar as any).caldav?.password || ''}`)
            : '';
          const body = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n` +
            `<d:propfind xmlns:d=\"DAV:\" xmlns:c=\"urn:ietf:params:xml:ns:caldav\">` +
            `<d:prop>` +
            `<d:current-user-principal/>` +
            `<c:calendar-home-set/>` +
            `</d:prop>` +
            `</d:propfind>`;
          const res = await fetch(baseUrl, {
            method: 'PROPFIND',
            headers: {
              'Content-Type': 'application/xml; charset=utf-8',
              'Depth': '0',
              ...(auth ? { 'Authorization': auth } : {}),
            },
            body,
          } as RequestInit);
          if (!res.ok) {
            const www = res.headers.get('www-authenticate') || '';
            setTestMessage(`Connection failed: ${res.status}. Auth: ${www}`);
            return;
          }
          setTestMessage('Connection successful.');
        }
      } catch (e: any) {
        setTestMessage(e?.message || 'Test failed');
      } finally {
        setTesting(false);
      }
    };

    // Ensure both weather and clock properties exist
    const weather = widgets.weather || {
      enabled: true,
      useCelsius: false
    };

    const clock = widgets.clock || {
      enabled: true,
      showSeconds: true
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">Weather Widget</h3>
              <div className="group relative">
                <Icon name="Info" size={16} className="text-secondary-400 cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 p-2 bg-secondary-800 text-sm text-secondary-100 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[2000]">
                  To use the weather widget, you need to:
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Get an API key from <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300">OpenWeatherMap</a></li>
                    <li>Set the <code className="bg-secondary-700 px-1 rounded">PUBLIC_OPENWEATHER_API_KEY</code> environment variable</li>
                  </ol>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-400">Display current weather information</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={weather.enabled}
              onChange={(e) => handleWidgetToggle('weather', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
          </label>
        </div>

        {weather.enabled && (
          <div className="pl-4 border-l-2 border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Temperature Unit</h4>
                <p className="text-xs text-gray-400">Choose between Celsius and Fahrenheit</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={weather.useCelsius}
                  onChange={(e) => handleTemperatureUnitToggle(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                <span className="ml-2 text-sm text-gray-400">
                  {weather.useCelsius ? 'Celsius' : 'Fahrenheit'}
                </span>
              </label>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Clock Widget</h3>
            <p className="text-sm text-gray-400">Display current time</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={clock.enabled}
              onChange={(e) => handleWidgetToggle('clock', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
          </label>
        </div>

        {clock.enabled && (
          <div className="pl-4 border-l-2 border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Show Seconds</h4>
                <p className="text-xs text-gray-400">Display seconds in the clock</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={clock.showSeconds}
                  onChange={(e) => handleClockSecondsToggle(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Calendar Widget</h3>
            <p className="text-sm text-gray-400">Import an ICS file and view monthly</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={calendar.enabled}
              onChange={(e) => handleWidgetToggle('calendar', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
          </label>
        </div>

        {calendar.enabled && (
          <div className="pl-4 border-l-2 border-gray-700 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <h4 className="text-sm font-medium">Source</h4>
                <p className="text-xs text-gray-400">Choose between an ICS URL or CalDAV collection</p>
              </div>
              <select
                className="px-2 py-1 bg-secondary-800 border border-secondary-700 rounded text-secondary-100"
                value={(calendar as any).source || 'ics'}
                onChange={(e) => handleCalendarSourceChange(e.target.value as 'ics' | 'caldav')}
              >
                <option value="ics">ICS</option>
                <option value="caldav">CalDAV</option>
              </select>
            </div>

            {((calendar as any).source || 'ics') === 'ics' && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">ICS URL</h4>
                    <p className="text-xs text-gray-400">Use a public URL or place a file in <code className="bg-secondary-700 px-1 rounded">/public</code> and reference it like <code className="bg-secondary-700 px-1 rounded">/calendar.ics</code>. Some remote URLs may require CORS.</p>
                  </div>
                </div>
                <input
                  type="url"
                  className="w-full px-3 py-2 bg-secondary-800 border border-secondary-700 rounded text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="/calendar.ics or https://example.com/feed.ics"
                  value={calendarUrlInput}
                  onChange={(e) => setCalendarUrlInput(e.target.value)}
                  onBlur={() => handleCalendarUrlChange(calendarUrlInput)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCalendarUrlChange(calendarUrlInput);
                    }
                  }}
                />
              </>
            )}

            {((calendar as any).source || 'ics') === 'caldav' && (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium">CalDAV URL</h4>
                  <p className="text-xs text-gray-400">Enter the calendar collection URL (e.g., https://server/dav/calendars/user/calendar/). May require CORS/proxy.</p>
                  <input
                    type="url"
                    className="mt-1 w-full px-3 py-2 bg-secondary-800 border border-secondary-700 rounded text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="https://example.com/dav/calendars/user/calendar/"
                    value={(calendar as any).caldav?.url || ''}
                    onChange={(e) => handleCalDavChange('url', e.target.value)}
                  />
                  <div className="mt-2 flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean((calendar as any).caldav?.useProxy)}
                        onChange={(e) => handleCalDavChange('useProxy', e.target.checked)}
                      />
                      <span className="text-secondary-300">Use server proxy</span>
                    </label>
                    <button
                      type="button"
                      className="px-3 py-1 rounded bg-secondary-700 hover:bg-secondary-600 text-secondary-100 text-sm"
                      onClick={testCalDavConnection}
                      disabled={testing}
                    >
                      {testing ? 'Testing…' : 'Test connection'}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1 rounded bg-secondary-700 hover:bg-secondary-600 text-secondary-100 text-sm"
                      onClick={discoverCalendars}
                      disabled={discovering}
                    >
                      {discovering ? 'Discovering…' : 'Discover calendars'}
                    </button>
                    {discoverError && (
                      <span className="text-xs text-red-400">{discoverError}</span>
                    )}
                    {testMessage && !discoverError && (
                      <span className="text-xs text-secondary-300">{testMessage}</span>
                    )}
                  </div>
                  {discoveredCalendars.length === 0 && (calendar as any).caldav?.useProxy && testMessage?.includes('Base:') && (
                    <div className="text-xs text-secondary-300">
                      If no calendars are listed, try opening the base in a browser and append your calendar name, e.g. <code className="bg-secondary-700 px-1 rounded">{testMessage.split('Base: ')[1]}</code><span className="opacity-70">&lt;your-calendar&gt;/</span>. Then paste that full URL above.
                    </div>
                  )}
                  {discoveredCalendars.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <select
                        className="flex-1 px-2 py-1 bg-secondary-800 border border-secondary-700 rounded text-secondary-100"
                        value={selectedDiscovered}
                        onChange={(e) => setSelectedDiscovered(e.target.value)}
                      >
                        {discoveredCalendars.map((c) => (
                          <option key={c.href} value={c.href}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="px-3 py-1 rounded bg-primary-600 hover:bg-primary-500 text-white text-sm"
                        onClick={applyDiscovered}
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <h4 className="text-sm font-medium">Username</h4>
                    <input
                      type="text"
                      className="mt-1 w-full px-3 py-2 bg-secondary-800 border border-secondary-700 rounded text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="username"
                      value={(calendar as any).caldav?.username || ''}
                      onChange={(e) => handleCalDavChange('username', e.target.value)}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Password</h4>
                    <input
                      type="password"
                      className="mt-1 w-full px-3 py-2 bg-secondary-800 border border-secondary-700 rounded text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="password"
                      value={(calendar as any).caldav?.password || ''}
                      onChange={(e) => handleCalDavChange('password', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Iframe Widget</h3>
            <p className="text-sm text-gray-400">Embed a web page via URL</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={iframe.enabled}
              onChange={(e) => handleWidgetToggle('iframe', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
          </label>
        </div>

        {iframe.enabled && (
          <div className="pl-4 border-l-2 border-gray-700 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <h4 className="text-sm font-medium">URL</h4>
                <p className="text-xs text-gray-400">Enter a valid http/https URL to embed</p>
              </div>
            </div>
            <input
              type="url"
              className="w-full px-3 py-2 bg-secondary-800 border border-secondary-700 rounded text-secondary-100 placeholder-secondary-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="https://example.com"
              value={iframe.url}
              onChange={(e) => handleIframeUrlChange(e.target.value)}
            />
          </div>
        )}
      </div>
    );
  };

  const AboutSettings = () => {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-secondary-200">About Modern Start Page</h3>
          <p className="text-secondary-300">
            A modern, customizable start page for your browser and new tab page.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-secondary-200">Links</h3>
          <div className="space-y-2">
            <a
              href="https://github.com/ericblue/modern-start-page"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-primary-400 hover:text-primary-300"
            >
              <Icon name="Github" size={16} />
              <span>GitHub Repository</span>
            </a>
            <a
              href="https://about.ericblue.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-primary-400 hover:text-primary-300"
            >
              <Icon name="User" size={16} />
              <span>Author Website</span>
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-secondary-200">License</h3>
          <p className="text-secondary-300">
            This project is licensed under the MIT License.
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 flex items-start justify-center pt-10 z-[1000] ${isOpen ? '' : 'hidden'}`}>
        <div className="bg-secondary-900 rounded-lg p-6 w-full max-w-4xl mt-10">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-secondary-700">
            <h2 className="text-xl font-semibold text-secondary-200">Settings</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded border border-secondary-700 text-secondary-200 hover:bg-secondary-800 hover:border-secondary-600 text-sm"
                title="Logout"
              >
                Logout
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-secondary-700 transition-colors"
                aria-label="Close settings"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setActiveTab('contexts')}
              className={`flex items-center space-x-2 px-4 py-2 rounded ${
                activeTab === 'contexts' ? 'bg-primary-500/20 text-primary-400' : 'text-secondary-300 hover:bg-secondary-800'
              }`}
            >
              <Icon name="Grid" size={16} />
              <span>Contexts</span>
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`flex items-center space-x-2 px-4 py-2 rounded ${
                activeTab === 'bookmarks' ? 'bg-primary-500/20 text-primary-400' : 'text-secondary-300 hover:bg-secondary-800'
              }`}
            >
              <Icon name="Bookmark" size={16} />
              <span>Bookmarks</span>
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center space-x-2 px-4 py-2 rounded ${
                activeTab === 'appearance' ? 'bg-primary-500/20 text-primary-400' : 'text-secondary-300 hover:bg-secondary-800'
              }`}
            >
              <Icon name="Palette" size={16} />
              <span>Appearance</span>
            </button>
            <button
              onClick={() => setActiveTab('widgets')}
              className={`flex items-center space-x-2 px-4 py-2 rounded ${
                activeTab === 'widgets' ? 'bg-primary-500/20 text-primary-400' : 'text-secondary-300 hover:bg-secondary-800'
              }`}
            >
              <Icon name="Grid" size={16} />
              <span>Widgets</span>
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex items-center space-x-2 px-4 py-2 rounded ${
                activeTab === 'backup' ? 'bg-primary-500/20 text-primary-400' : 'text-secondary-300 hover:bg-secondary-800'
              }`}
            >
              <Icon name="Database" size={16} />
              <span>Backup</span>
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`flex items-center space-x-2 px-4 py-2 rounded ${
                activeTab === 'about' ? 'bg-primary-500/20 text-primary-400' : 'text-secondary-300 hover:bg-secondary-800'
              }`}
            >
              <Icon name="Info" size={16} />
              <span>About</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 h-[70vh] overflow-y-auto">
            {activeTab === 'contexts' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Contexts</h3>
                  <button
                    onClick={() => setEditingContext({ id: '', name: '', categories: [] })}
                    className="flex items-center space-x-1 px-3 py-1 rounded bg-primary-500/20 text-primary-400 hover:bg-primary-500/30"
                  >
                    <Icon name="Plus" size={16} />
                    <span>Add Context</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {config.contexts.map(context => (
                    <div key={context.id} className="flex items-center justify-between p-2 rounded bg-secondary-800">
                      <div className="flex items-center space-x-2">
                        <Icon name="Grid" size={16} className="text-secondary-400" />
                        <span>{context.name}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleContextEdit(context)}
                          className="p-1 rounded hover:bg-secondary-700"
                        >
                          <Icon name="Pencil" size={16} />
                        </button>
                        <button
                          onClick={() => handleContextDelete(context.id)}
                          className="p-1 rounded hover:bg-secondary-700"
                        >
                          <Icon name="Trash2" size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'bookmarks' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold">Bookmarks</h3>
                    <select
                      value={selectedContextId}
                      onChange={(e) => setSelectedContextId(e.target.value)}
                      className="px-3 py-1 rounded bg-secondary-800 border border-secondary-700 text-secondary-200"
                    >
                      {config.contexts.map(context => (
                        <option key={context.id} value={context.id}>
                          {context.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => setEditingBookmark({ name: '', displayMode: 'icon', links: [] })}
                    className="flex items-center space-x-1 px-3 py-1 rounded bg-primary-500/20 text-primary-400 hover:bg-primary-500/30"
                  >
                    <Icon name="Plus" size={16} />
                    <span>Add Bookmark</span>
                  </button>
                </div>
                {config.contexts
                  .filter(context => context.id === selectedContextId)
                  .map(context => (
                    <div key={context.id} className="space-y-2">
                      <h4 className="text-primary-400 font-medium">{context.name}</h4>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleBookmarkDragEnd(event, context.id)}
                      >
                        <SortableContext
                          items={context.categories.map(category => category.name)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="grid gap-2">
                            {context.categories.map(category => (
                              <SortableItem key={category.name} id={category.name}>
                                <div>
                                  <span className="text-secondary-200">{category.name}</span>
                                  <span className="text-secondary-400 text-sm ml-2">
                                    ({category.links.length} links)
                                  </span>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleBookmarkEdit(category)}
                                    className="p-1 rounded hover:bg-secondary-600"
                                    title="Edit"
                                  >
                                    <Icon name="Pencil" size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleBookmarkDelete(context, category.name)}
                                    className="p-1 rounded hover:bg-secondary-600"
                                    title="Delete"
                                  >
                                    <Icon name="Trash2" size={16} />
                                  </button>
                                </div>
                              </SortableItem>
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  ))}
              </div>
            )}

            {activeTab === 'appearance' && (
              <AppearanceSettings />
            )}

            {activeTab === 'widgets' && (
              <WidgetsSettings />
            )}

            {activeTab === 'about' && (
              <AboutSettings />
            )}

            {activeTab === 'backup' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Backup & Restore</h3>
                <div className="space-y-4">
                  <button
                    onClick={handleExportConfig}
                    className="flex items-center space-x-2 px-4 py-2 rounded bg-primary-500/20 text-primary-400 hover:bg-primary-500/30"
                  >
                    <Icon name="Download" size={16} />
                    <span>Export Configuration</span>
                  </button>
                  <button
                    onClick={handleImportClick}
                    className="flex items-center space-x-2 px-4 py-2 rounded bg-primary-500/20 text-primary-400 hover:bg-primary-500/30"
                  >
                    <Icon name="Upload" size={16} />
                    <span>Import Configuration</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportConfig}
                    accept=".json"
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Edit Modal */}
      {editingContext && (
        <ContextEditModal
          context={editingContext}
          onSave={handleContextSave}
          onCancel={() => setEditingContext(null)}
          className="z-[2000]"
        />
      )}

      {/* Bookmark Edit Modal */}
      {editingBookmark && (
        <BookmarkEditModal
          category={editingBookmark}
          contextId={selectedContextId}
          onSave={handleBookmarkSave}
          onCancel={() => setEditingBookmark(null)}
          className="z-[2000]"
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[3000]">
          <div className="bg-secondary-900 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-secondary-200 mb-4">
              {confirmDialog.title}
            </h3>
            <p className="text-secondary-300 mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDialog({
                  isOpen: false,
                  title: '',
                  message: '',
                  isWarning: false,
                  action: null,
                  onConfirm: () => {},
                })}
                className="px-4 py-2 rounded bg-secondary-700 text-secondary-100 hover:bg-secondary-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded ${
                  confirmDialog.isWarning 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-primary-500 hover:bg-primary-600'
                } text-white`}
              >
                {confirmDialog.action === 'delete' ? 'Delete' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
