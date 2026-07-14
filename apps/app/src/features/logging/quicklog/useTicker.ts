import { useEffect, useState } from 'react';

/** Current time, re-rendering every `intervalMs` while `active` — for live timers. */
export function useTicker(active: boolean, intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(new Date());
    const initial = setTimeout(tick, 0); // refresh on activation, off the render path
    const id = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, [active, intervalMs]);
  return now;
}
