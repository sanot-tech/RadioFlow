import React from "react";
import { cn } from "@/lib/utils";

interface NowPlayingBackgroundEffectProps {
  isVisible: boolean;
}

const NowPlayingBackgroundEffect: React.FC<NowPlayingBackgroundEffectProps> = ({
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Blob 1: Top Left, subtle blue/purple */}
      <div
        className={cn(
          "absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-blue-500/20 opacity-50",
          "animate-blob animation-delay-2000",
        )}
        style={{
          transform: 'translate(-50%, -50%) translateZ(0)',
          willChange: 'transform, filter',
          filter: 'blur(64px)',
        }}
      />

      {/* Blob 2: Bottom Right, subtle pink/fuchsia */}
      <div
        className={cn(
          "absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-pink-500/20 opacity-50",
          "animate-blob animation-delay-4000",
        )}
        style={{
          transform: 'translate(50%, 50%) translateZ(0)',
          willChange: 'transform, filter',
          filter: 'blur(64px)',
        }}
      />

      {/* Blob 3: Center, subtle green/teal */}
      <div
        className={cn(
          "absolute top-1/2 left-1/2 w-40 h-40 rounded-full bg-teal-500/10 opacity-50",
          "animate-blob animation-delay-6000",
        )}
        style={{
          transform: 'translate(-50%, -50%) translateZ(0)',
          willChange: 'transform, filter',
          filter: 'blur(64px)',
        }}
      />
    </div>
  );
};

export default NowPlayingBackgroundEffect;
