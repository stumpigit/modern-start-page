import { useState, useEffect, useContext } from 'react';
import { ConfigContext } from './ConfigProvider';
import { Icon } from './Icon';

export const Clock = () => {
  const { config } = useContext(ConfigContext);
  
  // Ensure widgets property exists with clock settings
  const widgets = config.widgets || {
    weather: {
      enabled: true,
      useCelsius: false
    },
    clock: {
      enabled: true,
      showSeconds: true
    }
  };

  // Ensure clock property exists
  const clock = widgets.clock || {
    enabled: true,
    showSeconds: true
  };

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!clock.enabled) return;

    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [clock.enabled]);

  if (!clock.enabled) {
    return null;
  }

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = clock.showSeconds ? `:${time.getSeconds().toString().padStart(2, '0')}` : '';

  return (
    <div className="flex items-center gap-4 p-4 bg-secondary-700/50 rounded-lg">
      <div className="flex-shrink-0">
        <Icon name="Clock4" size={24} className="text-primary-500" />
      </div>
      <div>
        <div className="text-2xl font-bold">
          {hours}:{minutes}{seconds}
        </div>
        <div className="text-sm text-gray-300">Current Time</div>
      </div>
    </div>
  );
}; 