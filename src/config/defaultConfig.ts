import type { UserConfig } from './types';

export const defaultConfig: UserConfig = {
  contexts: [
    {
      id: 'default',
      name: 'Default',
      categories: [
        {
          name: "Productivity",
          displayMode: "list",
          links: [
            { name: "Gmail", url: "https://gmail.com", icon: "Mail" },
            { name: "Google Calendar", url: "https://calendar.google.com", icon: "Calendar" },
            { name: "Docs", url: "https://docs.google.com", icon: "FileText" }
          ]
        },
        {
          name: "Development",
          displayMode: "list",
          links: [
            { name: "GitHub", url: "https://github.com", icon: "Github" },
            { name: "Stack Overflow", url: "https://stackoverflow.com", icon: "HelpCircle" },
            { name: "GitLab", url: "https://gitlab.com", icon: "Gitlab" }
          ]
        },
        {
          name: "Media",
          displayMode: "list",
          links: [
            { name: "YouTube", url: "https://youtube.com", icon: "Youtube" },
            { name: "Spotify", url: "https://spotify.com", icon: "Music" },
            { name: "Netflix", url: "https://netflix.com", icon: "Tv" }
          ]
        },
        {
          name: "Social",
          displayMode: "list",
          links: [
            { name: "Twitter", url: "https://twitter.com", icon: "Twitter" },
            { name: "Reddit", url: "https://reddit.com", icon: "MessageSquare" },
            { name: "Instagram", url: "https://instagram.com", icon: "Instagram" }
          ]
        },
        {
          name: "Shopping",
          displayMode: "list",
          links: [
            { name: "Amazon", url: "https://amazon.com", icon: "ShoppingCart" },
            { name: "eBay", url: "https://ebay.com", icon: "Package" }
          ]
        }
      ]
    }
  ],
  activeContext: 'default',
  theme: 'light',
  gridColumns: 3,
  displayMode: 'list',
  showCategoryBorders: true,
  showSearchBar: true,
  widgets: {
    weather: {
      enabled: false,
      useCelsius: false
    },
    clock: {
      enabled: false,
      showSeconds: true,
    },
  },
  user: "",
};
