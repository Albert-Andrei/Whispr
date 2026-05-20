type WaveformProps = {
  level: number;
  bars?: number;
};

export function Waveform({ level, bars = 24 }: WaveformProps) {
  const items = Array.from({ length: bars }, (_, i) => {
    const center = bars / 2;
    const dist = Math.abs(i - center) / center;
    const height = Math.max(0.08, level * (1 - dist * 0.6));
    return height;
  });

  return (
    <div className="flex h-6 min-w-0 flex-1 items-center justify-center gap-0.5 px-1">
      {items.map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-zinc-700/80 transition-[height] duration-75 dark:bg-zinc-300/80"
          style={{ height: `${Math.round(h * 100)}%` }}
        />
      ))}
    </div>
  );
}
