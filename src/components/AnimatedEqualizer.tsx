import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedEqualizerProps {
  isPlaying: boolean;
  className?: string;
}

const AnimatedEqualizer: React.FC<AnimatedEqualizerProps> = ({
  isPlaying,
  className,
}) => {
  const barClasses =
    "w-1 h-full bg-primary rounded-full transition-all duration-150 ease-in-out";
  const animationClasses = isPlaying
    ? "animate-equalizer-bar"
    : "h-1/4 opacity-50";

  return (
    <div
      className={cn(
        "flex items-end justify-between w-8 h-8 overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(barClasses, animationClasses, "delay-100")}
        style={{ animationDelay: "0s" }}
      ></div>
      <div
        className={cn(barClasses, animationClasses, "delay-200")}
        style={{ animationDelay: "0.1s" }}
      ></div>
      <div
        className={cn(barClasses, animationClasses, "delay-300")}
        style={{ animationDelay: "0.2s" }}
      ></div>
      <div
        className={cn(barClasses, animationClasses, "delay-400")}
        style={{ animationDelay: "0.3s" }}
      ></div>
      <div
        className={cn(barClasses, animationClasses, "delay-500")}
        style={{ animationDelay: "0.4s" }}
      ></div>
    </div>
  );
};

export default AnimatedEqualizer;