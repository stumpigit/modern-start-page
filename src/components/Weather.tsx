import { useState, useEffect, useContext } from 'react';
import { Icon } from './Icon';
import { ConfigContext } from './ConfigProvider';

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  location: string;
}

export const Weather = () => {
  const { config } = useContext(ConfigContext);
  
  // Ensure widgets property exists
  const widgets = config.widgets || {
    weather: {
      enabled: true,
      useCelsius: false
    }
  };

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // First get user's location
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });

        const { latitude, longitude } = position.coords;
        
        // Then fetch weather data
        const apiKey = import.meta.env.PUBLIC_OPENWEATHER_API_KEY;
        console.log('API Key:', apiKey);
        
        if (!apiKey) {
          throw new Error('OpenWeather API key is not configured');
        }

        const units = widgets.weather.useCelsius ? 'metric' : 'imperial';
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=${units}&lang=en&appid=${apiKey}`;
        console.log('Weather API URL:', url);

        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Weather API Error:', errorData);
          throw new Error(`Weather API error: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('Weather Data:', data);
        
        setWeather({
          temperature: Math.round(data.main.temp),
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          location: data.name,
        });
      } catch (err) {
        console.error('Weather fetch error:', err);
        if (err instanceof Error) {
          setError(`Failed to load weather data: ${err.message}`);
        } else {
          setError('Failed to load weather data');
        }
      } finally {
        setLoading(false);
      }
    };

    if (widgets.weather.enabled) {
      fetchWeather();
    }
  }, [widgets.weather.enabled, widgets.weather.useCelsius]);

  if (!widgets.weather.enabled) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {error}
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-secondary-700/50 rounded-lg">
      <div className="flex-shrink-0">
        <img
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
          alt={weather.description}
          className="w-16 h-16"
        />
      </div>
      <div>
        <div className="text-2xl font-bold">
          {weather.temperature}°{widgets.weather.useCelsius ? 'C' : 'F'}
        </div>
        <div className="text-sm text-gray-300 capitalize">{weather.description}</div>
        <div className="text-sm text-gray-400">{weather.location}</div>
      </div>
    </div>
  );
}; 