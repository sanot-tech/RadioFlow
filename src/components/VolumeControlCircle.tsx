import React, { useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Import Dialog components
import { Slider } from "@/components/ui/slider"; // Import Slider
import { Label } from "@/components/ui/label"; // Import Label

interface VolumeControlCircleProps {
  volume: number; // 0 to 1
  setVolume: (volume: number) => void;
  className?: string;
  isModalOpen?: boolean; // New prop for external control
  onOpenModalChange?: (open: boolean) => void; // New prop for external control
}

const VolumeControlCircle: React.FC<VolumeControlCircleProps> = ({
  volume,
  setVolume,
  className,
  isModalOpen = false, // Default to false if not provided
  onOpenModalChange = () => {}, // Default no-op if not provided
}) => {
  const circleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Removed internal isModalOpen state, now controlled by props

  const handleVolumeChange = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!circleRef.current) return;

    const rect = circleRef.current.getBoundingClientRect();
    let clientY: number;

    if ('touches' in event) {
      clientY = event.touches[0].clientY;
    } else {
      clientY = event.clientY;
    }

    // Calculate volume based on vertical position within the circle
    // Top of the circle is max volume, bottom is min volume
    const y = clientY - rect.top; // Y position relative to the top of the circle
    const height = rect.height;

    // Invert Y: 0 at bottom (min volume), height at top (max volume)
    const invertedY = height - y;
    let newVolume = Math.max(0, Math.min(1, invertedY / height));

    // Snap to 0 if very close to bottom
    if (newVolume < 0.05) newVolume = 0;

    setVolume(newVolume);
  }, [setVolume]);

  const onMouseDown = useCallback((event: React.MouseEvent) => {
    setIsDragging(true);
    handleVolumeChange(event);
  }, [handleVolumeChange]);

  const onMouseMove = useCallback((event: React.MouseEvent) => {
    if (isDragging) {
      handleVolumeChange(event);
    }
  }, [isDragging, handleVolumeChange]);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false); // Stop dragging if mouse leaves the component area
    }
  }, [isDragging]);

  // Touch event handlers
  const onTouchStart = useCallback((event: React.TouchEvent) => {
    setIsDragging(true);
    handleVolumeChange(event);
  }, [handleVolumeChange]);

  const onTouchMove = useCallback((event: React.TouchEvent) => {
    if (isDragging) {
      handleVolumeChange(event);
      event.preventDefault(); // Prevent scrolling while dragging
    }
  }, [isDragging, handleVolumeChange]);

  const onTouchEnd = useCallback((event: React.TouchEvent) => { // Added event parameter
    setIsDragging(false);
  }, []);

  const handleModalSliderChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  const fillHeight = `${volume * 100}%`;
  const isMuted = volume === 0;

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-2 h-24", className)}>
      <div
        ref={circleRef}
        className="relative h-16 w-16 rounded-full bg-gray-700 border border-gray-600/50 shadow-lg overflow-hidden cursor-pointer group"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Water fill effect */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-blue-500 transition-all duration-100 ease-out"
          style={{ height: fillHeight }}
        ></div>
        {/* Icon overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
          {isMuted ? (
            <VolumeX className="h-6 w-6 text-red-400" />
          ) : (
            <Volume2 className="h-6 w-6 text-blue-400" />
          )}
          {/* Removed "Volume" text from inside the circle */}
        </div>
      </div>
      <span
        className="text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors border border-gray-600/50 rounded-sm px-2 py-0.5" // Added border styles
        onClick={() => onOpenModalChange(true)} // Make text clickable
      >
        Volume
      </span>

      {/* Modal Slider */}
      <Dialog open={isModalOpen} onOpenChange={onOpenModalChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adjust Volume</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-4">
              {isMuted ? (
                <VolumeX className="h-5 w-5 text-red-400" />
              ) : (
                <Volume2 className="h-5 w-5 text-blue-400" />
              )}
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={handleModalSliderChange}
                className="w-full"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VolumeControlCircle;