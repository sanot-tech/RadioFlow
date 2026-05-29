import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCountries } from "@/services/radioService";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X, Search } from "lucide-react";
import { shortenCountryName, cn } from "@/lib/utils";

interface CountrySelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCountry: (countryName: string) => void;
  selectedCountry?: string;
}

const CountrySelectionDialog: React.FC<CountrySelectionDialogProps> = ({
  isOpen,
  onClose,
  onSelectCountry,
  selectedCountry,
}) => {
  const isMobile = useIsMobile();
  const { data: countries, isLoading: isLoadingCountries } = useCountries();
  const [filter, setFilter] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setFilter("");
    }
  }, [isOpen]);

  const filteredCountries = useMemo(() => {
    if (!countries) return [];
    return countries.filter((country) =>
      country.toLowerCase().includes(filter.toLowerCase())
    );
  }, [countries, filter]);

  const handleCountryClick = (countryName: string) => {
    onSelectCountry(countryName);
    onClose();
  };

  const Content = (
    <>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <Input
          placeholder="Search countries..."
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
      {isLoadingCountries ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400/50" />
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-200px)] md:h-[420px] premium-scrollbar">
          <div className="flex flex-wrap gap-2 pr-3">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country, index) => {
                const isSelected = selectedCountry === country;
                return (
                  <button
                    key={country}
                    onClick={() => handleCountryClick(country)}
                    className={cn(
                      "glass-card rounded-xl px-3.5 py-2.5 flex items-center justify-center text-center cursor-pointer transition-all duration-300 outline-none",
                      isSelected && "selected"
                    )}
                    style={{
                      animation: `smooth-appear 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 20}ms forwards`,
                      opacity: 0,
                    }}
                  >
                    <span className="text-sm font-medium text-foreground/80 whitespace-nowrap">
                      {shortenCountryName(country)}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="w-full text-center text-muted-foreground/50 text-sm py-8">
                No countries found.
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
            <SheetTitle className="text-lg font-semibold text-foreground/90">Browse Countries</SheetTitle>
          </SheetHeader>
          <div className="mt-4 px-1">{Content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px] h-[600px] flex flex-col p-0 gap-0 z-[101] glass-premium border-[rgba(99,102,241,0.15)] animate-dialog-enter overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b border-[rgba(99,102,241,0.06)]">
          <DialogTitle className="text-lg font-semibold text-foreground/90">Browse Countries</DialogTitle>
        </DialogHeader>
        <div className="flex-1 flex flex-col overflow-hidden p-5 pt-4">
          {Content}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CountrySelectionDialog;
