import { useState, type ReactNode } from "react";

export type CatMood = "idle" | "count" | "snap" | "done";

const INK = "#2E2240";
const GINGER = "#FFA94D";
const BLUSH = "#FF8FB3";

function Eyes({ mood }: { mood: CatMood }) {
  if (mood === "snap")
    return (
      <g stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M51 38 l7 4 l-7 4" />
        <path d="M89 38 l-7 4 l7 4" />
      </g>
    );
  if (mood === "done")
    return (
      <g stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M50 45 q5 -8 10 0" />
        <path d="M80 45 q5 -8 10 0" />
      </g>
    );
  return (
    <g className="cat-blink" fill={INK}>
      <ellipse cx="56" cy="42" rx="3.6" ry="4.6" />
      <ellipse cx="84" cy="42" rx="3.6" ry="4.6" />
    </g>
  );
}

/** Tiny ginger cat that sits on the top edge of the camera card. */
export default function Cat({ mood, tick }: { mood: CatMood; tick: number }) {
  const [petted, setPetted] = useState(0);
  const shown = petted ? "done" : mood;

  function pet() {
    setPetted((n) => n + 1);
    setTimeout(() => setPetted(0), 900);
  }

  return (
    <button
      type="button"
      onClick={pet}
      aria-label="pet the cat"
      className="block w-[112px] sm:w-[128px] cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
    >
      <svg
        // remount on each tick / pet so the bounce replays
        key={`${mood}-${tick}-${petted}`}
        viewBox="0 0 140 92"
        className={mood === "count" || petted ? "cat-bounce" : undefined}
        aria-hidden
      >
        <g className="cat-tail" fill="none" strokeLinecap="round">
          <path d="M104 80 q26 -2 24 -26 q-1 -8 -7 -8" stroke={INK} strokeWidth="11" />
          <path d="M104 80 q26 -2 24 -26 q-1 -8 -7 -8" stroke={GINGER} strokeWidth="6" />
        </g>
        {/* body */}
        <ellipse cx="70" cy="84" rx="40" ry="20" fill={GINGER} stroke={INK} strokeWidth="3" />
        {/* ears */}
        <g className="cat-ear">
          <path d="M44 30 L40 4 L64 20 Z" fill={GINGER} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d="M46 24 L44 11 L56 19 Z" fill={BLUSH} />
        </g>
        <path d="M96 30 L100 4 L76 20 Z" fill={GINGER} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M94 24 L96 11 L84 19 Z" fill={BLUSH} />
        {/* head */}
        <ellipse cx="70" cy="44" rx="34" ry="28" fill={GINGER} stroke={INK} strokeWidth="3" />
        <g stroke={INK} strokeWidth="2.5" strokeLinecap="round">
          <path d="M62 19 v6" />
          <path d="M70 17 v7" />
          <path d="M78 19 v6" />
        </g>
        <Eyes mood={shown} />
        <ellipse cx="48" cy="54" rx="6" ry="3.5" fill={BLUSH} opacity="0.8" />
        <ellipse cx="92" cy="54" rx="6" ry="3.5" fill={BLUSH} opacity="0.8" />
        <path d="M67 49 h6 l-3 3.5 Z" fill={BLUSH} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
        <path
          d={shown === "done" ? "M63 55 q7 9 14 0" : "M63 55 q3.5 4 7 0 q3.5 4 7 0"}
          fill={shown === "done" ? BLUSH : "none"}
          stroke={INK}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* front paws resting on the card edge */}
        <ellipse cx="54" cy="88" rx="10" ry="6" fill={GINGER} stroke={INK} strokeWidth="3" />
        <ellipse cx="86" cy="88" rx="10" ry="6" fill={GINGER} stroke={INK} strokeWidth="3" />
      </svg>
    </button>
  );
}

/** Paw print. `filled` false draws just the outline. */
export function Paw({
  size = 16,
  filled = true,
  className,
  children,
}: {
  size?: number;
  filled?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const fill = filled ? "currentColor" : "none";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
      stroke="currentColor"
      strokeWidth={filled ? 0 : 6}
    >
      <ellipse cx="50" cy="66" rx="26" ry="22" fill={fill} />
      <ellipse cx="20" cy="40" rx="10" ry="13" fill={fill} />
      <ellipse cx="38" cy="22" rx="10" ry="13" fill={fill} />
      <ellipse cx="62" cy="22" rx="10" ry="13" fill={fill} />
      <ellipse cx="80" cy="40" rx="10" ry="13" fill={fill} />
      {children}
    </svg>
  );
}
