import React from 'react';
import { Bot } from 'lucide-react';

interface FloatingRobotProps {
  onClick: () => void;
}

const FloatingRobot: React.FC<FloatingRobotProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-28 right-3 z-[110] w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/70 to-purple-600/70 hover:from-indigo-500/90 hover:to-purple-600/90 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-400/30 transition-all duration-300 flex items-center justify-center group cursor-pointer animate-fade-in border border-indigo-400/10 backdrop-blur-sm robot-pulse"
      aria-label="Open AI Chat"
    >
      <span className="absolute inset-0 rounded-xl robot-halo" />
      <Bot className="h-5 w-5 text-white/80 group-hover:text-white robot-icon-zoom" />
      <style>{`
        .robot-pulse {
          animation: robotVibrate 3s ease-in-out infinite;
        }
        .robot-icon-zoom {
          animation: robotZoom 3s ease-in-out infinite;
        }
        .robot-halo {
          background: radial-gradient(circle at center, rgba(139,92,246,0.25) 0%, transparent 70%);
          animation: haloBreathe 2.5s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes robotVibrate {
          0%, 100% { transform: translate(0, 0); }
          15% { transform: translate(0.5px, -0.5px); }
          30% { transform: translate(-0.3px, 0.3px); }
          45% { transform: translate(0.4px, 0.2px); }
          60% { transform: translate(-0.2px, -0.4px); }
          75% { transform: translate(0.3px, 0.5px); }
          90% { transform: translate(-0.5px, -0.2px); }
        }
        @keyframes robotZoom {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.15); }
          50% { transform: scale(0.95); }
          75% { transform: scale(1.08); }
        }
        .robot-halo {
          animation: haloBreathe 2.5s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes haloBreathe {
          0%, 100% { box-shadow: 0 0 8px rgba(139,92,246,0.2), 0 0 16px rgba(139,92,246,0.08); }
          50% { box-shadow: 0 0 16px rgba(139,92,246,0.5), 0 0 32px rgba(139,92,246,0.25), 0 0 48px rgba(139,92,246,0.1), 0 0 64px rgba(139,92,246,0.05); }
        }
        .robot-pulse:hover { animation-play-state: paused; }
        .robot-pulse:hover .robot-icon-zoom { animation-play-state: paused; }
        .robot-pulse:hover .robot-halo { animation-play-state: paused; }
      `}</style>
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border-2 border-[#0F0F23] animate-pulse" />
    </button>
  );
};

export default FloatingRobot;
