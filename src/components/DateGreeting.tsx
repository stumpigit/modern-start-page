import { useState, useEffect } from 'react';

export default function DateGreeting() {
  const [date, setDate] = useState(new Date());
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setDate(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const hour = date.getHours();
    let newGreeting = '';

    if (hour >= 5 && hour < 12) {
      newGreeting = 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      newGreeting = 'Good afternoon';
    } else if (hour >= 17 && hour < 22) {
      newGreeting = 'Good evening';
    } else {
      newGreeting = 'Good night';
    }

    setGreeting(newGreeting);
  }, [date]);

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="text-center space-y-2">
      <p className="text-2xl text-secondary-400">{formattedDate}</p>
      <h2 className="text-5xl font-bold text-secondary-200">{greeting}</h2>
    </div>
  );
} 