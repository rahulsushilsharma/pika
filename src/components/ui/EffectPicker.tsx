import { EFFECTS, type PhotoEffect } from "@/lib/themes";
import { cn } from "@/lib/utils";

interface Props {
  active: string;
  onChange: (effect: PhotoEffect) => void;
}

export default function EffectPicker({ active, onChange }: Props) {
  return (
    <div className="w-full">
      <p className="text-xs font-medium text-muted-foreground mb-2 pl-0.5">
        photo effect
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none p-0.5">
        {EFFECTS.map((effect) => (
          <button
            key={effect.id}
            onClick={() => onChange(effect)}
            className={cn(
              "shrink-0 flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200 hover:scale-[1.05] active:scale-[0.97]",
              active === effect.id
                ? "border-primary bg-primary/10 text-primary shadow-sm scale-[1.05]"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <span className="text-lg leading-none">{effect.emoji}</span>
            <span className="leading-none">{effect.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
