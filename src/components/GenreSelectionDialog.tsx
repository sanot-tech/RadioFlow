import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGenres, Category } from "@/services/radioService";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenreSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: Category) => void;
  currentSearchQuery: string;
}

function stringToGradient(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 55%, 45%), hsl(${hue2}, 50%, 35%))`;
}

function getInitial(str: string): string {
  return str.charAt(0).toUpperCase();
}

const GenreSelectionDialog: React.FC<GenreSelectionDialogProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  currentSearchQuery,
}) => {
  const isMobile = useIsMobile();
  const { data: categories, isLoading: isLoadingGenres } = useGenres();
  const [filter, setFilter] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setFilter("");
    }
  }, [isOpen]);

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter(
      (category) =>
        category &&
        typeof category.name === "string" &&
        category.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [categories, filter]);

  const handleCategoryClick = (category: Category) => {
    onSelectCategory(category);
    onClose();
  };

  const Content = (
    <>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <Input
          placeholder="Search genres..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-9 pr-9 bg-background/50 border-[rgba(99,102,241,0.1)] focus-visible:ring-1 focus-visible:ring-indigo-500/30 focus-visible:ring-offset-0 focus:outline-none rounded-xl text-sm"
        />
        {filter && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFilter("")}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
      {isLoadingGenres ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400/50" />
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-200px)] md:h-[420px] premium-scrollbar">
          <div className="flex flex-wrap gap-2 pr-3">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category, index) => {
                if (!category || typeof category.name !== "string") return null;
                const gradient = stringToGradient(category.name);
                const isSelected = currentSearchQuery === category.name;
                return (
                  <button
                    key={category.name}
                    onClick={() => handleCategoryClick(category)}
                    className={cn(
                      "group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer outline-none",
                      "bg-background/30 border border-[rgba(99,102,241,0.08)]",
                      "hover:scale-105 hover:shadow-lg",
                      isSelected && "scale-105"
                    )}
                    style={{
                      animation: `smooth-appear 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 15}ms forwards`,
                      opacity: 0,
                    }}
                  >
                    {/* Gradient dot */}
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full shrink-0 transition-all duration-300",
                        isSelected && "w-3 h-3"
                      )}
                      style={{ background: gradient }}
                    />
                    {/* Text */}
                    <span className={cn(
                      "text-muted-foreground/80 transition-colors duration-300",
                      "group-hover:text-foreground/90",
                      isSelected && "text-foreground"
                    )}>
                      {category.name}
                    </span>
                    {/* Subtle glow on hover */}
                    <div
                      className={cn(
                        "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 -z-10",
                        "group-hover:opacity-100"
                      )}
                      style={{
                        background: `${gradient.replace('135deg', '135deg')}`,
                        opacity: 0.05,
                      }}
                    />
                  </button>
                );
              })
            ) : (
              <p className="w-full text-center text-muted-foreground/50 text-sm py-8">
                No genres found.
              </p>
            )}
          </div>
        </ScrollArea>
      )}
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl p-2 glass-premium">
          <SheetHeader className="px-2 pt-2">
            <SheetTitle className="text-lg font-semibold text-foreground/90">Browse Genres</SheetTitle>
            <SheetDescription className="text-muted-foreground/60 text-xs">
              Select a genre to discover new stations.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 px-1">{Content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px] max-h-[600px] flex flex-col p-0 gap-0 z-[101] glass-premium border-[rgba(99,102,241,0.15)] animate-dialog-enter overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b border-[rgba(99,102,241,0.06)]">
          <DialogTitle className="text-lg font-semibold text-foreground/90">Browse Genres</DialogTitle>
          <DialogDescription className="text-muted-foreground/60 text-xs mt-0.5">
            Select a genre to discover new stations.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex flex-col overflow-hidden p-5 pt-4">
          {Content}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenreSelectionDialog;
