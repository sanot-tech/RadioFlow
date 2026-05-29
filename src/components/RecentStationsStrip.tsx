import React, { useEffect, useState, useRef } from "react";
import { getRecentStations } from "@/services/recentStationsService";
import { useRadioPlayer } from "@/context/RadioPlayerContext";
import { Clock, ChevronLeft, ChevronRight, Music } from "lucide-react";
import type { Station } from "@/types/radio";

const RecentStationsStrip: React.FC = () => {
  const [recent, setRecent] = useState<Station[]>([]);
  const { currentStation, playStation } = useRadioPlayer();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecent(getRecentStations());
  }, [currentStation?.id]);

  if (recent.length === 0) return null;

  const scrollBy = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent</span>
      </div>
      <div className="flex items-center gap-2 group">
        <button
          onClick={() => scrollBy('left')}
          className="shrink-0 w-7 h-7 rounded-full bg-indigo-950/80 border border-indigo-500/20 flex items-center justify-center text-indigo-400 opacity-40 group-hover:opacity-100 transition-opacity hover:bg-indigo-900/80"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scroll-smooth flex-1"
        >
          {recent.map((s) => (
            <button
              key={s.id}
              onClick={() => playStation(s)}
              className="flex items-center gap-2 shrink-0 px-3 py-2 rounded-xl bg-indigo-950/40 border border-indigo-500/10 hover:bg-indigo-900/50 hover:border-indigo-400/30 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/60 to-purple-600/60 flex items-center justify-center shrink-0 overflow-hidden">
                {s.imageUrl && !s.imageUrl.includes('picsum') ? (
                  <img src={s.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <Music className="w-4 h-4 text-white/80" />
                )}
              </div>
              <div className="min-w-0 max-w-[120px]">
                <div className="text-xs font-medium text-gray-200 truncate">{s.name}</div>
                {s.tags && <div className="text-[10px] text-gray-500 truncate">{s.tags.split(',')[0]}</div>}
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={() => scrollBy('right')}
          className="shrink-0 w-7 h-7 rounded-full bg-indigo-950/80 border border-indigo-500/20 flex items-center justify-center text-indigo-400 opacity-40 group-hover:opacity-100 transition-opacity hover:bg-indigo-900/80"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default RecentStationsStrip;
