import { THEMES, type BoothTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";

interface Props {
  active: string;
  onChange: (theme: BoothTheme) => void;
}

export default function ThemePicker({ active, onChange }: Props) {
  return (
    <div className="w-full">
      <p className="text-xs font-medium text-muted-foreground mb-2 pl-0.5">frame theme</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onChange(theme)}
            className={cn(
              "flex-shrink-0 flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200 hover:scale-[1.05] active:scale-[0.97]",
              active === theme.id
                ? "border-primary bg-primary/10 text-primary shadow-sm scale-[1.05]"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            <span className="text-lg leading-none">{theme.emoji}</span>
            <span className="leading-none">{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
