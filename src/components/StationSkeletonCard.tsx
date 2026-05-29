import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StationSkeletonCardProps {
  className?: string;
}

const StationSkeletonCard: React.FC<StationSkeletonCardProps> = ({ className }) => {
  return (
    <Card className={cn("relative group overflow-hidden", className)}>
      <CardContent className="p-4 flex items-center space-x-4">
        <div className="relative flex-shrink-0 w-20 h-20">
          <Skeleton className="w-full h-full rounded-lg animate-shimmer" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-3/4 rounded-md animate-shimmer" />
          <div className="flex flex-wrap items-center gap-1">
            <Skeleton className="h-4 w-1/4 rounded-md animate-shimmer" />
            <Skeleton className="h-4 w-1/6 rounded-md animate-shimmer" />
            <Skeleton className="h-4 w-1/5 rounded-md animate-shimmer" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StationSkeletonCard;