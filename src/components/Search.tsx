import { useState } from 'react';

const searchEngines = {
  google: 'https://google.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  bing: 'https://www.bing.com/search?q=',
  youtube: 'https://www.youtube.com/results?search_query=',
  github: 'https://github.com/search?q=',
};

type SearchEngine = keyof typeof searchEngines;

interface SearchProps {
  isVisible?: boolean;
}

export default function Search({ isVisible = true }: SearchProps) {
  const [query, setQuery] = useState('');
  const [engine, setEngine] = useState<SearchEngine>('google');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const searchUrl = searchEngines[engine] + encodeURIComponent(query);
      window.open(searchUrl, '_blank');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Quick engine switch with keyboard shortcuts
    if (e.altKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'g':
          setEngine('google');
          break;
        case 'd':
          setEngine('duckduckgo');
          break;
        case 'b':
          setEngine('bing');
          break;
        case 'y':
          setEngine('youtube');
          break;
        case 'h':
          setEngine('github');
          break;
      }
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  if (!isVisible) return null;

  return (
    <div className="relative z-10 search-container">
      <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Search with ${engine} (Alt + G/D/B/Y/H to switch)`}
            className="w-full px-4 py-3 pl-12 pr-12 bg-secondary-800/50 rounded-lg border border-secondary-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 outline-none text-black placeholder-secondary-500"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400">
            🔍
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
              {eng.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
} 