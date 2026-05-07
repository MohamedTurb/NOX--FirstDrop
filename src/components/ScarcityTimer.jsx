import React, { useEffect, useState } from 'react';
import { subscribeConfig } from '../firebaseHelpers';

export default function ScarcityTimer() {
  const [config, setConfig] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const unsub = subscribeConfig((cfg) => setConfig(cfg));
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    if (!config || !config.waitlistCloseAt) return;
    const target = new Date(config.waitlistCloseAt.seconds ? config.waitlistCloseAt.toMillis() : config.waitlistCloseAt).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [config]);

  if (!config) return null;
  if (config.soldOut) return <div className="text-sm font-semibold text-red-400">Sold out</div>;
  if (!config.waitlistCloseAt) return null;

  const secs = Math.floor((timeLeft || 0) / 1000);
  const days = Math.floor(secs / 86400);
  const hours = Math.floor((secs % 86400) / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const s = secs % 60;

  return (
    <div className="rounded px-3 py-2 bg-white/5 text-sm">
      <div className="font-semibold">Waitlist closes in</div>
      <div className="mt-1">{days}d {hours}h {mins}m {s}s</div>
    </div>
  );
}
