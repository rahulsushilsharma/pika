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
  /** Extra drawing per photo, after effect + border. `s` = scale vs a 640px-wide shot. */
  decorate?: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, i: number, s: number) => void;
}

export interface PhotoEffect {
  id: string;
  name: string;
  emoji: string;
  apply: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => void;
}

// ── Canvas doodles ────────────────────────────────────────

function paw(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rot: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.ellipse(0, r * 0.3, r * 0.55, r * 0.45, 0, 0, Math.PI * 2);
  for (const [tx, ty] of [[-0.6, -0.2], [-0.24, -0.62], [0.24, -0.62], [0.6, -0.2]]) {
    ctx.moveTo(tx * r + r * 0.2, ty * r);
    ctx.ellipse(tx * r, ty * r, r * 0.2, r * 0.26, 0, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();
}

function heart(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.9);
  ctx.bezierCurveTo(cx - r * 1.4, cy - r * 0.1, cx - r * 0.7, cy - r * 1.2, cx, cy - r * 0.45);
  ctx.bezierCurveTo(cx + r * 0.7, cy - r * 1.2, cx + r * 1.4, cy - r * 0.1, cx, cy + r * 0.9);
  ctx.fill();
  ctx.stroke();
}

function sparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fill();
}

export const THEMES: BoothTheme[] = [
  {
    id: "kitty",
    name: "Kitty",
    emoji: "🐱",
    backgroundColor: "#fff4f8",
    backgroundGradient: ["#fff4f8", "#ffe3c2"],
    frameColor: "#ffa94d",
    frameWidth: 8,
    padding: 72,
    gap: 72,
    decorate: (ctx, x, y, w, _h, _i, s) => {
      // ears sit on the top edge of each photo
      const eh = 62 * s, ew = 40 * s;
      for (const [cx, dir] of [[x + w * 0.2, -1], [x + w * 0.8, 1]]) {
        ctx.fillStyle = "#ffa94d";
        ctx.beginPath();
        ctx.moveTo(cx - ew, y);
        ctx.lineTo(cx + dir * 6 * s, y - eh);
        ctx.lineTo(cx + ew, y);
        ctx.fill();
        ctx.fillStyle = "#ff8fb3";
        ctx.beginPath();
        ctx.moveTo(cx - ew * 0.5, y);
        ctx.lineTo(cx + dir * 4 * s, y - eh * 0.6);
        ctx.lineTo(cx + ew * 0.5, y);
        ctx.fill();
      }
    },
  },
  {
    id: "paws",
    name: "Paws",
    emoji: "🐾",
    backgroundColor: "#f2fbf7",
    backgroundGradient: ["#fff4f8", "#dff6ed"],
    frameColor: "#2e2240",
    frameWidth: 5,
    padding: 56,
    gap: 28,
    decorate: (ctx, x, y, w, h, i, s) => {
      // a little trail where the cat walked across the corner
      ctx.fillStyle = "rgba(255, 143, 179, 0.9)";
      const flip = i % 2 ? -1 : 1;
      const ox = flip > 0 ? x + w * 0.06 : x + w * 0.94;
      for (let k = 0; k < 3; k++) {
        paw(ctx, ox + flip * k * 38 * s, y + h - 22 * s - k * 30 * s, 15 * s, flip * 0.5);
      }
    },
  },
  {
    id: "purikura",
    name: "Purikura",
    emoji: "💖",
    backgroundColor: "#ffd6e7",
    backgroundGradient: ["#ffd6e7", "#e7dcff"],
    frameColor: "#ffffff",
    frameWidth: 10,
    padding: 56,
    gap: 28,
    decorate: (ctx, x, y, w, h, i, s) => {
      ctx.save();
      ctx.fillStyle = "#ff8fb3";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 5 * s;
      heart(ctx, i % 2 ? x + w - 6 * s : x + 6 * s, y + 4 * s, 26 * s);
      ctx.fillStyle = "#ffffff";
      sparkle(ctx, i % 2 ? x + 30 * s : x + w - 30 * s, y + 30 * s, 16 * s);
      sparkle(ctx, i % 2 ? x + 56 * s : x + w - 56 * s, y + 58 * s, 9 * s);
      ctx.fillStyle = "#fff3a6";
      sparkle(ctx, i % 2 ? x + 28 * s : x + w - 28 * s, y + h - 28 * s, 14 * s);
      ctx.restore();
    },
  },
  {
    id: "classic",
    name: "Classic",
    emoji: "🖤",
    backgroundColor: "#111111",
    frameColor: "#ffffff",
    frameWidth: 6,
    padding: 40,
    gap: 18,
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
