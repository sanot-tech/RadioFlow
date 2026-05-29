import React, { useCallback } from 'react';
import { ChevronUp } from 'lucide-react';

interface ScrollToPlayerButtonProps {
  scrollContainerRef: React.RefObject<HTMLElement>;
  playerCardRef: React.RefObject<HTMLElement>;
}

const ScrollToPlayerButton: React.FC<ScrollToPlayerButtonProps> = ({ scrollContainerRef, playerCardRef }) => {
  const scrollToPlayer = useCallback(() => {
    const playerCard = playerCardRef.current;
    if (playerCard) {
      const top = playerCard.getBoundingClientRect().top + (scrollContainerRef.current?.scrollTop || 0) - 10;
      scrollContainerRef.current?.scrollTo({ top, behavior: 'smooth' });
    }
  }, [scrollContainerRef, playerCardRef]);

  return (
    <button
      onClick={scrollToPlayer}
      className="hidden md:flex fixed right-2 top-1/2 z-50 w-8 h-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white transition-all duration-200 shadow-lg"
      style={{ transform: 'translateY(-50%)' }}
      aria-label="Scroll to player"
    >
      <ChevronUp className="h-4 w-4" />
    </button>
  );
};

export default ScrollToPlayerButton;
