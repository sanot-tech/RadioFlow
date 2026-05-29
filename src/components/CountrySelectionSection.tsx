"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCountries } from "@/services/radioService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountrySelectionSectionProps {
  onSelectCountry: (countryName: string) => void;
  selectedCountry?: string;
}

const CountrySelectionSection: React.FC<CountrySelectionSectionProps> = ({
  onSelectCountry,
  selectedCountry,
}) => {
  const { data: countries, isLoading: isLoadingCountries } = useCountries();
  const [filter, setFilter] = useState("");

  const filteredCountries = useMemo(() => {
    if (!countries) return [];
    return countries.filter((country) =>
      country.toLowerCase().includes(filter.toLowerCase())
    );
  }, [countries, filter]);

  const handleCountryClick = (countryName: string) => {
    onSelectCountry(countryName);
  };

  return (
    <section className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground/90">Countries</h2>
      </div>
      <div className="relative">
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
        <ScrollArea className="h-[200px] premium-scrollbar">
          <div className="flex flex-wrap gap-2 pr-3">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => {
                const isSelected = selectedCountry === country;
                return (
                  <button
                    key={country}
                    onClick={() => handleCountryClick(country)}
                    className={cn(
                      "glass-card rounded-xl px-3.5 py-2.5 flex items-center justify-center text-center cursor-pointer transition-all duration-300 outline-none",
                      isSelected && "selected"
                    )}
                  >
                    <span className="text-sm font-medium text-foreground/80 whitespace-nowrap">
                      {country}
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
    </section>
  );
};

export default CountrySelectionSection;
