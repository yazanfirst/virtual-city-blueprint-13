import { Map } from "lucide-react";
import StreetCard from "@/components/StreetCard";
import { useStreets } from "@/hooks/useStreets";

const CityMap = () => {
  const { data: streets, isLoading } = useStreets();

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-12 px-3 sm:px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
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

        {/* Streets Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground animate-pulse">Loading streets...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streets?.map((street) => (
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
