import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const StationCardSkeleton: React.FC = () => (
  <div className="relative w-full max-w-[340px]">
    <Card className="w-full h-52 rounded-xl shadow-lg bg-card/80 backdrop-blur-sm border-white/10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1E1B4B]/40 via-[#4338CA]/10 to-[#0F0F23] rounded-xl" />
      <div className="absolute inset-0 animate-shimmer"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.04) 30%, rgba(236,72,153,0.04) 50%, rgba(168,85,247,0.04) 70%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
      />
      <CardContent className="p-4 h-full flex flex-col relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-5 w-16 rounded-full bg-white/5 animate-pulse" />
          <div className="ml-auto flex gap-1">
            <div className="h-5 w-5 rounded-full bg-white/5 animate-pulse" />
            <div className="h-5 w-5 rounded-full bg-white/5 animate-pulse" />
          </div>
        </div>
        <div className="flex-1 flex items-center gap-4 min-w-0">
          <div className="w-16 h-16 rounded-xl bg-white/5 animate-pulse flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 w-3/4 rounded bg-white/5 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
        <div className="mt-auto flex items-center gap-2">
          <div className="h-3 w-12 rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-16 rounded bg-white/5 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  </div>
);

export default StationCardSkeleton;
