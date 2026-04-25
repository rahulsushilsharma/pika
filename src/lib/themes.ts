export interface BoothTheme {
  id: string;
  name: string;
  emoji: string;
  // canvas
  backgroundColor: string;
  backgroundGradient?: [string, string];
  frameColor: string;
  frameWidth: number;
  padding: number;
  gap: number;
  // UI accent (oklch string swapped into --primary)
  accent: string;
}

export interface PhotoEffect {
  id: string;
  name: string;
  emoji: string;
  apply: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => void;
}

export const THEMES: BoothTheme[] = [
  {
    id: "classic",
    name: "Classic",
    emoji: "🖤",
    backgroundColor: "#111111",
    frameColor: "#ffffff",
    frameWidth: 6,
    padding: 40,
    gap: 18,
    accent: "oklch(0.65 0.22 0)",
  },
  {
    id: "bubblegum",
    name: "Bubblegum",
    emoji: "🍬",
    backgroundColor: "#fce4ec",
    backgroundGradient: ["#fce4ec", "#e8bbf7"],
    frameColor: "#f06292",
    frameWidth: 8,
    padding: 44,
    gap: 20,
    accent: "oklch(0.65 0.22 0)",
  },
  {
    id: "midnight",
    name: "Midnight",
    emoji: "🌙",
    backgroundColor: "#0d0d1a",
    backgroundGradient: ["#0d0d1a", "#1a0a2e"],
    frameColor: "#d4af37",
    frameWidth: 7,
    padding: 40,
    gap: 16,
    accent: "oklch(0.78 0.15 80)",
  },
  {
    id: "y2k",
    name: "Y2K",
    emoji: "💿",
    backgroundColor: "#00f5d4",
    backgroundGradient: ["#00f5d4", "#b8ff57"],
    frameColor: "#c0c0c0",
    frameWidth: 6,
    padding: 36,
    gap: 14,
    accent: "oklch(0.72 0.18 195)",
  },
  {
    id: "nature",
    name: "Nature",
    emoji: "🌿",
    backgroundColor: "#f5f0e8",
    backgroundGradient: ["#f5f0e8", "#d4e8c2"],
    frameColor: "#6b8f5e",
    frameWidth: 7,
    padding: 42,
    gap: 18,
    accent: "oklch(0.58 0.12 145)",
  },
  {
    id: "neon",
    name: "Neon",
    emoji: "⚡",
    backgroundColor: "#080010",
    backgroundGradient: ["#080010", "#150030"],
    frameColor: "#bf5fff",
    frameWidth: 5,
    padding: 38,
    gap: 16,
    accent: "oklch(0.6 0.28 300)",
  },
];

export const EFFECTS: PhotoEffect[] = [
  {
    id: "none",
    name: "Original",
    emoji: "✨",
    apply: () => {},
  },
  {
    id: "bw",
    name: "B&W",
    emoji: "◻️",
    apply: (ctx, x, y, w, h) => {
      const data = ctx.getImageData(x, y, w, h);
      for (let i = 0; i < data.data.length; i += 4) {
        const avg = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2];
        data.data[i] = data.data[i + 1] = data.data[i + 2] = avg;
      }
      ctx.putImageData(data, x, y);
    },
  },
  {
    id: "warm",
    name: "Warm",
    emoji: "🌅",
    apply: (ctx, x, y, w, h) => {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "#ff8c42";
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    },
  },
  {
    id: "cool",
    name: "Cool",
    emoji: "❄️",
    apply: (ctx, x, y, w, h) => {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "#4fc3f7";
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    },
  },
  {
    id: "vignette",
    name: "Vignette",
    emoji: "🔮",
    apply: (ctx, x, y, w, h) => {
      ctx.save();
      const grad = ctx.createRadialGradient(x + w / 2, y + h / 2, w * 0.25, x + w / 2, y + h / 2, w * 0.75);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    },
  },
  {
    id: "grain",
    name: "Grain",
    emoji: "📷",
    apply: (ctx, x, y, w, h) => {
      const data = ctx.getImageData(x, y, w, h);
      for (let i = 0; i < data.data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 40;
        data.data[i] = Math.min(255, Math.max(0, data.data[i] + noise));
        data.data[i + 1] = Math.min(255, Math.max(0, data.data[i + 1] + noise));
        data.data[i + 2] = Math.min(255, Math.max(0, data.data[i + 2] + noise));
      }
      ctx.putImageData(data, x, y);
    },
  },
  {
    id: "fade",
    name: "Faded",
    emoji: "🌫️",
    apply: (ctx, x, y, w, h) => {
      const data = ctx.getImageData(x, y, w, h);
      for (let i = 0; i < data.data.length; i += 4) {
        // lift blacks + reduce contrast
        data.data[i]     = data.data[i]     * 0.75 + 50;
        data.data[i + 1] = data.data[i + 1] * 0.75 + 45;
        data.data[i + 2] = data.data[i + 2] * 0.75 + 55;
      }
      ctx.putImageData(data, x, y);
    },
  },
];

export const DEFAULT_THEME = THEMES[0];
export const DEFAULT_EFFECT = EFFECTS[0];
