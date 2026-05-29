import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Play, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStationSearch } from '@/hooks/useStationSearch';
import { Station } from '@/services/radioService';
import { useRadioPlayer } from '@/context/RadioPlayerContext';
import StationImagePlaceholder from './StationImagePlaceholder';
import { cn } from '@/lib/utils';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, isSearching } = useStationSearch(query);
  const navigate = useNavigate();
  const { playStation, currentStation, isPlaying } = useRadioPlayer();
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleClose = useCallback(() => {
    setQuery('');
    setSelectedIndex(-1);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  const handleSelectStation = useCallback((station: Station) => {
    playStation(station);
    handleClose();
  }, [playStation, handleClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { handleClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      }
      if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
        handleSelectStation(results[selectedIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, handleClose, handleSelectStation]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[120px]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xl" onClick={handleClose} />
      <div className="relative w-full max-w-xl mx-4 glass-premium rounded-2xl shadow-2xl shadow-indigo-500/10 border border-white/10 overflow-hidden animate-fade-in">
        <div className="flex items-center gap-3 p-4 border-b border-white/5">
          <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for radio stations..."
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50 font-body text-base"
          />
          {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {query && !isSearching && (
            <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {results.length > 0 && (
          <div className="max-h-[320px] overflow-y-auto p-2 space-y-1">
            {results.map((station, index) => {
              const isActive = currentStation?.id === station.id && isPlaying;
              return (
                <button
                  key={station.id}
                  onClick={() => handleSelectStation(station)}
                  className={cn(
                    'w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-150 text-left group',
                    selectedIndex === index
                      ? 'bg-white/10 ring-1 ring-white/10'
                      : 'hover:bg-white/5',
                  )}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-card">
                    {station.imageUrl && !station.imageUrl.includes('picsum') ? (
                      <img src={station.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <StationImagePlaceholder stationName={station.name} className="w-full h-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate font-display">
                      {station.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {station.genre} · {station.country}
                    </p>
                  </div>
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150',
                    isActive
                      ? 'bg-[#22C55E]/20 text-[#22C55E]'
                      : 'bg-white/5 text-muted-foreground opacity-0 group-hover:opacity-100'
                  )}>
                    <Play className="h-4 w-4" fill={isActive ? 'currentColor' : 'none'} />
                  </div>
                </button>
              );
            })}

            <div className="px-2.5 py-2 text-xs text-muted-foreground/60 text-center border-t border-white/5 mt-1">
              {results.length >= 10 ? 'Showing top 10 results' : `${results.length} results`}
            </div>
          </div>
        )}

        {query && !isSearching && results.length === 0 && (
          <div className="p-8 text-center text-muted-foreground/60">
            <p className="text-sm">No stations found for "{query}"</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        )}

        {!query && (
          <div className="p-8 text-center text-muted-foreground/40">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Type to search stations by name</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;
