import { EFFECTS, type PhotoEffect } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface Props {
  active: string;
  onChange: (effect: PhotoEffect) => void;
}

export default memo(function EffectPicker({ active, onChange }: Props) {
  return (
    <div className="w-full">
      <p className="text-sm font-bold mb-2 pl-0.5">
        effect
      </p>
      <div className="flex flex-wrap gap-2 p-0.5">
        {EFFECTS.map((effect) => (
          <button
            key={effect.id}
            onClick={() => onChange(effect)}
            aria-pressed={active === effect.id}
            className={cn(
              "flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border-2 text-xs font-bold transition-transform duration-150 active:scale-[0.95]",
              active === effect.id
                ? "border-ink bg-ginger/25 text-ink -translate-y-0.5"
                : "border-border bg-card text-muted-foreground hover:border-ink/40 hover:text-ink",
            )}
          >
            <span className="text-lg leading-none">{effect.emoji}</span>
            <span className="leading-none">{effect.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
});
