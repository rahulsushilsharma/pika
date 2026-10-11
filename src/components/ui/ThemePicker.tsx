import { THEMES, type BoothTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface Props {
  active: string;
  onChange: (theme: BoothTheme) => void;
}

export default memo(function ThemePicker({ active, onChange }: Props) {
  return (
    <div className="w-full">
      <p className="text-sm font-bold mb-2 pl-0.5">
        frame
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none p-0.5 pr-8 [mask-image:linear-gradient(to_right,black_85%,transparent)]">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onChange(theme)}
            aria-pressed={active === theme.id}
            className={cn(
              "shrink-0 flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border-2 text-xs font-bold transition-transform duration-150 active:scale-[0.95]",
              active === theme.id
                ? "border-ink bg-ginger/25 text-ink -translate-y-0.5"
                : "border-border bg-card text-muted-foreground hover:border-ink/40 hover:text-ink",
            )}
          >
            <span className="text-lg leading-none">{theme.emoji}</span>
            <span className="leading-none">{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
});
