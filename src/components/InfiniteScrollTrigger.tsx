import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface InfiniteScrollTriggerProps {
  onTrigger: () => void;
  isLoading: boolean;
  hasMore: boolean;
  className?: string;
}

const InfiniteScrollTrigger: React.FC<InfiniteScrollTriggerProps> = ({
  onTrigger,
  isLoading,
  hasMore,
  className,
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onTrigger();
        }
      },
      { rootMargin: '1000px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onTrigger, isLoading, hasMore]);

  if (!hasMore && !isLoading) {
    return (
      <div className={cn("text-center text-muted-foreground py-4", className)}>
        All stations loaded.
      </div>
    );
  }

  return (
    <div
      ref={triggerRef}
      className={cn("w-full", className)}
    >
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

export default InfiniteScrollTrigger;