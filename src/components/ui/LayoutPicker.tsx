import { cn } from "@/lib/utils";

export interface LayoutTemplate {
  id: string;
  name: string;
  cols: number;
  rows: number;
}

export const LAYOUTS: LayoutTemplate[] = [
  { id: "duo-side",   name: "Duo",      cols: 2, rows: 1 },
  { id: "strip",      name: "Strip",    cols: 1, rows: 3 },
  { id: "quad",       name: "Classic",  cols: 2, rows: 2 },
  { id: "trio-wide",  name: "Trio",     cols: 3, rows: 1 },
  { id: "six",        name: "Six",      cols: 2, rows: 3 },
  { id: "nine",       name: "Nine",     cols: 3, rows: 3 },
];

export const DEFAULT_LAYOUT = LAYOUTS[2]; // quad

function GridPreview({ cols, rows }: { cols: number; rows: number }) {
  const cellW = cols === 1 ? 28 : cols === 2 ? 20 : 14;
  const cellH = rows === 1 ? 28 : rows === 2 ? 20 : rows === 3 ? 14 : 10;
  const gap = 3;

  return (
    <div
      className="flex flex-col"
      style={{ gap }}
    >
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex" style={{ gap }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="rounded-[2px] bg-current opacity-70"
              style={{ width: cellW, height: cellH }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface Props {
  active: string;
  onChange: (layout: LayoutTemplate) => void;
}

export default function LayoutPicker({ active, onChange }: Props) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {LAYOUTS.map((layout) => {
          const isActive = active === layout.id;
          return (
            <button
              key={layout.id}
              onClick={() => onChange(layout)}
              className={cn(
                "flex flex-col items-center justify-center gap-2.5 py-4 px-2 rounded-2xl border transition-all duration-200 hover:scale-[1.04] active:scale-[0.97]",
                isActive
                  ? "border-primary bg-primary/8 text-primary shadow-sm scale-[1.04]"
                  : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              <GridPreview cols={layout.cols} rows={layout.rows} />
              <span className="text-[11px] font-semibold leading-none">{layout.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
