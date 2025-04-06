import { useState, useContext } from 'react';
import { ConfigContext } from './ConfigProvider';
import { Icon } from './Icon';

const searchEngines = {
  google: 'https://google.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  bing: 'https://www.bing.com/search?q=',
  youtube: 'https://www.youtube.com/results?search_query=',
  github: 'https://github.com/search?q=',
};

type SearchEngine = keyof typeof searchEngines;

export default function Search() {
  const { config, onConfigChange } = useContext(ConfigContext);
  const [query, setQuery] = useState('');
  const [engine, setEngine] = useState<SearchEngine>('google');
  const [showTooltip, setShowTooltip] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const searchUrl = searchEngines[engine] + encodeURIComponent(query);
      window.open(searchUrl, '_blank');
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  if (!config.showSearchBar) return null;

  return (
    <div className="relative z-10 search-container">
      <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you looking for?"
            className="w-full px-4 py-3 pl-12 pr-12 bg-secondary-800/50 rounded-lg border border-secondary-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 outline-none text-black placeholder-secondary-400 placeholder-italic"
          />
          <div 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 cursor-help"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Icon name="Search" size={20} />
            {showTooltip && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-secondary-800 text-secondary-200 text-sm rounded-lg shadow-lg whitespace-nowrap">
                <span className="text-primary-400">⌘</span> + <span className="text-primary-400">⇧</span> + <span className="text-primary-400">S</span> to toggle
              </div>
            )}
          </div>
        </div>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="text-secondary-400 hover:text-secondary-200 transition-colors"
            >
              ✕
            </button>
          )}
          {Object.keys(searchEngines).map((eng) => (
            <button
              key={eng}
              type="button"
              onClick={() => setEngine(eng as SearchEngine)}
              className={`text-xs px-2 py-1 rounded ${
                engine === eng
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-secondary-400 hover:text-primary-400'
              }`}
            >
              {eng}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
} 