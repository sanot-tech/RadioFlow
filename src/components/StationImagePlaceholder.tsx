import React, { useMemo } from "react";
import { cn, cleanStationName } from "@/lib/utils";

const PALETTES = [
  { from: "#6366f1", mid: "#8b5cf6", to: "#4f46e5", accent: "#a5b4fc", glow: "rgba(99,102,241,0.3)" },
  { from: "#06b6d4", mid: "#3b82f6", to: "#0891b2", accent: "#67e8f9", glow: "rgba(6,182,212,0.3)" },
  { from: "#22c55e", mid: "#10b981", to: "#16a34a", accent: "#86efac", glow: "rgba(34,197,94,0.3)" },
  { from: "#a855f7", mid: "#d946ef", to: "#9333ea", accent: "#d8b4fe", glow: "rgba(168,85,247,0.3)" },
  { from: "#f43f5e", mid: "#ec4899", to: "#e11d48", accent: "#fda4af", glow: "rgba(244,63,94,0.3)" },
  { from: "#f59e0b", mid: "#f97316", to: "#d97706", accent: "#fcd34d", glow: "rgba(245,158,11,0.3)" },
  { from: "#14b8a6", mid: "#2dd4bf", to: "#0d9488", accent: "#99f6e4", glow: "rgba(20,184,166,0.3)" },
  { from: "#8b5cf6", mid: "#6366f1", to: "#7c3aed", accent: "#c4b5fd", glow: "rgba(139,92,246,0.3)" },
  { from: "#0ea5e9", mid: "#38bdf8", to: "#0284c7", accent: "#bae6fd", glow: "rgba(14,165,233,0.3)" },
  { from: "#f97316", mid: "#f59e0b", to: "#ea580c", accent: "#fdba74", glow: "rgba(249,115,22,0.3)" },
  { from: "#84cc16", mid: "#65a30d", to: "#4d7c0f", accent: "#bef264", glow: "rgba(132,204,22,0.3)" },
  { from: "#06b6d4", mid: "#22d3ee", to: "#0891b2", accent: "#a5f3fc", glow: "rgba(6,182,212,0.3)" },
  { from: "#d946ef", mid: "#ec4899", to: "#be185d", accent: "#f0abfc", glow: "rgba(217,70,239,0.3)" },
  { from: "#e11d48", mid: "#fb7185", to: "#be123c", accent: "#fecdd3", glow: "rgba(225,29,72,0.3)" },
  { from: "#2563eb", mid: "#3b82f6", to: "#1d4ed8", accent: "#93c5fd", glow: "rgba(37,99,235,0.3)" },
];

const PATTERNS: ((palette: typeof PALETTES[0], seed: number) => string)[] = [
  (p, s) => `radial-gradient(circle at ${20 + s % 60}% ${20 + (s * 7) % 60}%, ${p.from}44, transparent ${50}%),
radial-gradient(circle at ${70 + (s * 3) % 30}% ${60 + (s * 11) % 40}%, ${p.mid}33, transparent ${40}%),
radial-gradient(circle at ${30 + (s * 13) % 50}% ${70 + (s * 5) % 20}%, ${p.to}33, transparent ${50}%)`,
  (p, s) => `radial-gradient(ellipse at ${40 + s % 20}% ${10 + (s * 7) % 30}%, ${p.from}33, transparent ${70}%),
radial-gradient(ellipse at ${60 + (s * 3) % 30}% ${65 + (s * 11) % 25}%, ${p.mid}33, transparent ${60}%)`,
  (p, s) => `linear-gradient(${20 + s % 140}deg, ${p.from}22, transparent ${30 + s % 30}%, ${p.mid}22, transparent ${70 + (s * 7) % 30}%, ${p.to}22)`,
  (p, s) => `conic-gradient(from ${s * 3.6}deg at 30% 40%, ${p.from}33, ${p.mid}22, ${p.to}33, ${p.from}11, ${p.from}33)`,
  (p, s) => `radial-gradient(circle at ${50 + (s * 13) % 30}% ${20 + (s * 7) % 50}%, ${p.from}44, ${p.mid}22 ${30 + s % 20}%, transparent ${70}%),
radial-gradient(circle at ${20 + (s * 5) % 40}% ${70 + (s * 11) % 20}%, ${p.to}33, transparent ${50}%)`,
  (p, s) => `linear-gradient(135deg, ${p.from}33, transparent 40%, ${p.mid}22 60%, transparent 80%, ${p.to}22),
radial-gradient(circle at ${80 + (s * 3) % 20}% ${30 + (s * 7) % 40}%, ${p.accent}22, transparent ${40}%)`,
  (p, s) => `linear-gradient(180deg, ${p.from}22, transparent 40%),
radial-gradient(circle at ${30 + s % 50}% ${50 + (s * 3) % 40}%, ${p.mid}33, transparent ${50}%),
radial-gradient(circle at ${70 + (s * 11) % 20}% ${30 + (s * 7) % 30}%, ${p.to}22, transparent ${40}%)`,
  (p, s) => `repeating-linear-gradient(${s % 180}deg, ${p.from}11 0px, transparent 1px, transparent ${8 + s % 12}px),
linear-gradient(135deg, ${p.mid}33, ${p.to}22)`,
];

const FONT_STYLES = [
  { font: "font-bold", size: "clamp(0.55rem, 1.5vw, 0.7rem)", tracking: "tracking-tight" },
  { font: "font-extrabold", size: "clamp(0.5rem, 1.4vw, 0.65rem)", tracking: "tracking-wide" },
  { font: "font-semibold italic", size: "clamp(0.5rem, 1.3vw, 0.6rem)", tracking: "tracking-normal" },
  { font: "font-black", size: "clamp(0.55rem, 1.5vw, 0.7rem)", tracking: "tracking-tighter" },
  { font: "font-bold", size: "clamp(0.5rem, 1.4vw, 0.65rem)", tracking: "tracking-wider" },
  { font: "font-medium", size: "clamp(0.5rem, 1.3vw, 0.6rem)", tracking: "tracking-normal" },
  { font: "font-extrabold italic", size: "clamp(0.5rem, 1.4vw, 0.65rem)", tracking: "tracking-tight" },
  { font: "font-black", size: "clamp(0.55rem, 1.5vw, 0.7rem)", tracking: "tracking-wide" },
];

const DOT_POSITIONS = [
  { top: "10%", left: "15%", size: "3px" },
  { top: "25%", right: "20%", size: "2px" },
  { top: "60%", left: "10%", size: "4px" },
  { top: "80%", right: "15%", size: "2px" },
  { top: "40%", right: "10%", size: "3px" },
  { top: "15%", right: "35%", size: "2px" },
  { top: "70%", left: "30%", size: "3px" },
  { top: "90%", left: "50%", size: "2px" },
  { top: "35%", left: "60%", size: "4px" },
  { top: "50%", right: "5%", size: "2px" },
];

function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function generateArtStyles(stationName: string) {
  const hash = hashStr(stationName);
  const palette = PALETTES[hash % PALETTES.length];
  const patternFn = PATTERNS[hash % PATTERNS.length];
  const fontStyle = FONT_STYLES[(hash * 3) % FONT_STYLES.length];
  const dotIndices = [
    hash % DOT_POSITIONS.length,
    (hash * 7) % DOT_POSITIONS.length,
    (hash * 13) % DOT_POSITIONS.length,
  ].filter((v, i, a) => a.indexOf(v) === i);

  const bgGradients = [
    `linear-gradient(135deg, ${palette.from}44, ${palette.mid}22, ${palette.to}33)`,
    patternFn(palette, hash),
    `linear-gradient(180deg, ${palette.from}11, transparent 50%)`,
  ];

  return { palette, fontStyle, bgGradients, dotIndices };
}

function shortenName(name: string, maxLen: number = 18): [string, string] {
  if (name.length <= maxLen) {
    const parts = name.split(" ");
    if (parts.length <= 1) return [name, ""];
    const mid = Math.ceil(parts.length / 2);
    return [parts.slice(0, mid).join(" "), parts.slice(mid).join(" ")];
  }
  const words = name.split(" ");
  let line1 = "";
  let i = 0;
  for (; i < words.length; i++) {
    if ((line1 + " " + words[i]).trim().length > Math.ceil(maxLen / 2)) break;
    line1 += (line1 ? " " : "") + words[i];
  }
  const rest = words.slice(i).join(" ");
  if (rest.length > maxLen / 2) {
    return [line1, rest.slice(0, Math.floor(maxLen / 2)) + "…"];
  }
  return [line1, rest];
}

const StationImagePlaceholder: React.FC<{
  stationName: string;
  className?: string;
}> = ({ stationName, className }) => {
  const cleanedName = cleanStationName(stationName);
  const { palette, fontStyle, bgGradients, dotIndices } = useMemo(
    () => generateArtStyles(cleanedName),
    [cleanedName]
  );

  const [line1, line2] = shortenName(cleanedName, 16);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden",
        className,
      )}
      style={{ background: bgGradients.join(", ") }}
    >
      {dotIndices.map((i) => {
        const dot = DOT_POSITIONS[i];
        return (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              top: dot.top,
              left: dot.left,
              right: (dot as any).right,
              width: dot.size,
              height: dot.size,
              backgroundColor: palette.accent,
              opacity: 0.4 + (i * 0.1),
            }}
          />
        );
      })}
      <div
        className="absolute inset-0 pointer-events-none animate-gradient-drift"
        style={{
          background: `linear-gradient(135deg, ${palette.from}22 0%, ${palette.mid}11 25%, ${palette.to}22 50%, ${palette.mid}11 75%, ${palette.from}22 100%)`,
          backgroundSize: '400% 400%',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none animate-glass-shimmer"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${palette.accent}11 50%, transparent 100%)`,
          backgroundSize: '200% 100%',
        }}
      />
      <span
        className={cn(
          "text-center leading-tight px-0.5 select-none relative z-10",
          fontStyle.font,
          fontStyle.tracking,
        )}
        style={{
          fontSize: fontStyle.size,
          color: palette.accent,
          textShadow: `0 0 20px ${palette.glow}, 0 0 40px ${palette.from}44`,
          lineHeight: 1.1,
          wordBreak: 'break-word',
        }}
      >
        {line1}
        {line2 && <><br />{line2}</>}
      </span>
    </div>
  );
};

export default StationImagePlaceholder;
