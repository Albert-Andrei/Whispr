type RangeSliderProps = {
  max: number;
  start: number;
  end: number;
  /** Preview position, drawn as a thin marker. */
  playhead?: number;
  disabled?: boolean;
  onChange: (start: number, end: number, moved: "start" | "end") => void;
};

/** Keep at least this many seconds between the two handles. */
const MIN_GAP_SECS = 1;

const THUMB =
  "pointer-events-none absolute inset-0 h-5 w-full appearance-none bg-transparent outline-none disabled:opacity-50 " +
  "[&::-webkit-slider-runnable-track]:bg-transparent " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-sky-500 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm active:[&::-webkit-slider-thumb]:cursor-grabbing " +
  "focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-sky-500/40";

/** Two-handle slider selecting [start, end] seconds of the media. */
export function RangeSlider({
  max,
  start,
  end,
  playhead,
  disabled,
  onChange,
}: RangeSliderProps) {
  const safeMax = Math.max(max, MIN_GAP_SECS);
  const pct = (v: number) => `${(Math.min(safeMax, Math.max(0, v)) / safeMax) * 100}%`;
  // When both handles sit at the far right, the start handle must be on top to stay draggable.
  const startOnTop = start > safeMax - MIN_GAP_SECS * 2;

  return (
    <div className="relative h-5">
      {/* Inset by the thumb radius so the fill lines up with the handle centres. */}
      <div className="absolute inset-x-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="absolute inset-y-0 rounded-full bg-sky-500"
          style={{ left: pct(start), right: `calc(100% - ${pct(end)})` }}
        />
        {playhead !== undefined ? (
          <div
            className="absolute -top-1 h-3 w-0.5 -translate-x-1/2 rounded-full bg-zinc-900 dark:bg-zinc-100"
            style={{ left: pct(playhead) }}
          />
        ) : null}
      </div>
      <input
        type="range"
        min={0}
        max={safeMax}
        step={1}
        value={start}
        disabled={disabled}
        onChange={(e) => {
          const v = Math.min(Number(e.target.value), end - MIN_GAP_SECS);
          onChange(Math.max(0, v), end, "start");
        }}
        className={`${THUMB} ${startOnTop ? "z-20" : "z-10"}`}
      />
      <input
        type="range"
        min={0}
        max={safeMax}
        step={1}
        value={end}
        disabled={disabled}
        onChange={(e) => {
          const v = Math.max(Number(e.target.value), start + MIN_GAP_SECS);
          onChange(start, Math.min(safeMax, v), "end");
        }}
        className={`${THUMB} z-10`}
      />
    </div>
  );
}
