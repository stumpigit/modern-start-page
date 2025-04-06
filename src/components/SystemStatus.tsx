import { useState, useEffect } from 'react';
import { Icon } from './Icon';

export default function SystemStatus() {
  const [time, setTime] = useState(new Date());
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get battery status
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setBattery({
            level: battery.level * 100,
            charging: battery.charging
          });
        };

        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);

        return () => {
          battery.removeEventListener('levelchange', updateBattery);
          battery.removeEventListener('chargingchange', updateBattery);
        };
      });
    }
  }, []);

  // Network status
  useEffect(() => {
    const updateNetworkStatus = () => {
      setNetworkStatus(navigator.onLine);
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="flex items-center justify-center space-x-6 text-secondary-400">
      <div className="flex items-center space-x-2">
        <Icon name="Clock" size={20} />
        <span>{formatTime(time)}</span>
      </div>

      {battery && (
        <div className="flex items-center space-x-2">
          <Icon 
            name={battery.charging ? "BatteryCharging" : "Battery"} 
            size={20} 
          />
          <span>{Math.round(battery.level)}%</span>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Icon 
          name={networkStatus ? "Wifi" : "WifiOff"} 
          size={20} 
        />
        <span>{networkStatus ? "Online" : "Offline"}</span>
      </div>
    </div>
  );
} 