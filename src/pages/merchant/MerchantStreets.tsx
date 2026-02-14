import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import StreetCard from "@/components/StreetCard";
import { useStreets } from "@/hooks/useStreets";

const MerchantStreets = () => {
  const navigate = useNavigate();
  const { data: streets, isLoading } = useStreets();

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-12 px-3 sm:px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/merchant/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <MapPin className="h-5 w-5 text-primary" />
              <h1 className="font-display text-3xl font-bold text-foreground">
                Choose a Street
              </h1>
            </div>
            <p className="text-muted-foreground">
              Select a street to view available shops
            </p>
          </div>
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
                id={street.id}
                name={street.name}
                category={street.category}
                isActive={street.is_active ?? false}
                actionLabel="View Shops"
                onAction={street.is_active ? () => navigate(`/merchant/shops/${street.slug}`) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantStreets;
