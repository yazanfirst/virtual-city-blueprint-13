import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import StreetCard from "@/components/StreetCard";
import { streets } from "@/lib/streets";

const MerchantStreets = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streets.map((street) => (
            <StreetCard
              key={street.id}
              id={street.id}
              name={street.name}
              category={street.category}
              isActive={street.isActive}
              actionLabel="View Shops"
              onAction={street.isActive ? () => navigate(`/merchant/shops/${street.id}`) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MerchantStreets;
