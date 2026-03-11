import { useState, useMemo } from "react";
import { Map, Search } from "lucide-react";
import StreetCard from "@/components/StreetCard";
import { useStreets } from "@/hooks/useStreets";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CityMap = () => {
  const { data: streets, isLoading } = useStreets();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Derive unique categories from streets
  const categories = useMemo(() => {
    if (!streets) return [];
    const cats = Array.from(new Set(streets.map(s => s.category)));
    return cats.sort();
  }, [streets]);

  // Filter streets by search + category
  const filtered = useMemo(() => {
    if (!streets) return [];
    return streets.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCategory === "all" || s.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [streets, search, activeCategory]);

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-12 px-3 sm:px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 glow-primary mb-6">
            <Map className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-3">
            City Map
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose a street to explore
          </p>
        </div>

        {/* Search & Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search streets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
                activeCategory === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Streets Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground animate-pulse">Loading streets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No streets found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((street) => (
              <StreetCard
                key={street.id}
                id={street.slug}
                name={street.name}
                category={street.category}
                isActive={street.is_active ?? false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CityMap;
