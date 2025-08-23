import { useContext, useEffect, useMemo, useState } from 'react';
import { ConfigContext } from './ConfigProvider';
import { Icon } from './Icon';

type CalendarEvent = {
  uid?: string;
  start: Date;
  end?: Date;
  summary?: string;
  location?: string;
};

function parseIcs(content: string): CalendarEvent[] {
  // Handle folded lines: lines that start with space are continuations
  const unfolded = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .reduce<string[]>((acc, line) => {
      if (line.startsWith(' ') && acc.length) {
        acc[acc.length - 1] += line.slice(1);
      } else {
        acc.push(line);
      }
      return acc;
    }, []);

  const events: CalendarEvent[] = [];
  let inEvent = false;
  let cur: Partial<CalendarEvent> = {};

  const parseDate = (val?: string): Date | undefined => {
    if (!val) return undefined;
    // Remove timezone or parameters before ':'
    const idx = val.indexOf(':');
    const raw = idx >= 0 ? val.slice(idx + 1) : val;
    // Date (YYYYMMDD) or DateTime (YYYYMMDDTHHMMSSZ)
    if (/^\d{8}$/.test(raw)) {
      const y = Number(raw.slice(0, 4));
      const m = Number(raw.slice(4, 6)) - 1;
      const d = Number(raw.slice(6, 8));
      return new Date(y, m, d);
    }
    // Try to parse as ISO; convert to proper format
    const dt = raw.replace(
      /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)/,
      '$1-$2-$3T$4:$5:$6$7'
    );
    const date = new Date(dt);
    return isNaN(date.getTime()) ? undefined : date;
  };

  for (const line of unfolded) {
    if (line.startsWith('BEGIN:VEVENT')) {
      inEvent = true;
      cur = {};
    } else if (line.startsWith('END:VEVENT')) {
      if (inEvent && cur.start) {
        events.push(cur as CalendarEvent);
      }
      inEvent = false;
      cur = {};
    } else if (inEvent) {
      if (line.startsWith('UID')) cur.uid = line.split(':').slice(1).join(':');
      else if (line.startsWith('DTSTART')) cur.start = parseDate(line) as Date;
      else if (line.startsWith('DTEND')) cur.end = parseDate(line);
      else if (line.startsWith('SUMMARY')) cur.summary = line.split(':').slice(1).join(':');
      else if (line.startsWith('LOCATION')) cur.location = line.split(':').slice(1).join(':');
    }
  }

  return events;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export const CalendarWidget = () => {
  const { config } = useContext(ConfigContext);
  const widgets = config.widgets || ({} as any);
  const calendarCfg = widgets.calendar || { enabled: false, icsUrl: '' };

  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!calendarCfg.enabled || !calendarCfg.icsUrl) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(calendarCfg.icsUrl);
        if (!res.ok) throw new Error(`Failed to fetch ICS (${res.status})`);
        const text = await res.text();
        const parsed = parseIcs(text);
        setEvents(parsed);
      } catch (e: any) {
        setError(e?.message || 'Failed to load calendar');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [calendarCfg.enabled, calendarCfg.icsUrl]);

  if (!calendarCfg.enabled) return null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const startWeekday = monthStart.getDay(); // 0=Sun
  const daysInMonth = monthEnd.getDate();

  // Build calendar cells including leading/trailing blanks to complete weeks
  const firstCellDate = new Date(monthStart);
  firstCellDate.setDate(firstCellDate.getDate() - startWeekday);

  const cells = Array.from({ length: 42 }).map((_, i) => {
    const d = new Date(firstCellDate);
    d.setDate(firstCellDate.getDate() + i);
    return d;
  });

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const start = ev.start;
      const end = ev.end || ev.start;
      // Iterate days from start to end inclusive (simple, no tz handling)
      const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      while (cur <= last) {
        const key = cur.toISOString().slice(0, 10);
        const list = map.get(key) || [];
        list.push(ev);
        map.set(key, list);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return map;
  }, [events]);

  const monthLabel = currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const weekdayLabels = Array.from({ length: 7 }).map((_, i) =>
    new Date(2020, 5, 7 + i).toLocaleDateString(undefined, { weekday: 'short' })
  );

  return (
    <div className="rounded-lg overflow-hidden border border-white">
      <div className="flex items-center justify-between px-3 py-2 border-b border-secondary-600 bg-secondary-700/50">
        <div className="flex items-center gap-2 text-secondary-200 text-sm">
          <Icon name="Calendar" size={16} className="text-primary-500" />
          <span className="capitalize">{monthLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 text-sm rounded bg-secondary-700 hover:bg-secondary-600"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            className="px-2 py-1 text-sm rounded bg-secondary-700 hover:bg-secondary-600"
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
          >
            Today
          </button>
          <button
            className="px-2 py-1 text-sm rounded bg-secondary-700 hover:bg-secondary-600"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-4 text-sm text-secondary-300">Loading events…</div>
      )}
      {error && (
        <div className="p-4 text-sm text-red-400">{error}</div>
      )}

      <div className="p-2 sm:p-3">
        <div className="grid grid-cols-7 gap-px bg-secondary-700 rounded">
          {weekdayLabels.map((w) => (
            <div key={w} className="text-center text-xs sm:text-sm py-2 text-secondary-200 bg-secondary-800">
              {w}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-px bg-secondary-700 rounded">
          {cells.map((d) => {
            const inMonth = d.getMonth() === currentMonth.getMonth();
            const key = d.toISOString().slice(0, 10);
            const dayEvents = eventsByDay.get(key) || [];
            const today = isSameDay(d, new Date());
            return (
              <div key={key} className={`h-24 sm:h-28 p-1 bg-secondary-900 ${inMonth ? '' : 'opacity-40'}`}>
                <div className="flex items-center justify-between text-xs text-secondary-300">
                  <div className={`w-6 h-6 flex items-center justify-center rounded ${today ? 'bg-primary-500 text-white' : ''}`}>{d.getDate()}</div>
                </div>
                <div className="mt-1 space-y-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((ev, idx) => (
                    <div key={idx} className="truncate text-[10px] sm:text-xs px-1 py-0.5 rounded bg-primary-500/20 text-primary-300">
                      {ev.summary || 'Event'}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] sm:text-xs text-secondary-400">+{dayEvents.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;

