import { ShopBranding } from "@/hooks/use3DShops";
import { DoorOpen } from "lucide-react";

interface ShopProximityIndicatorProps {
  nearbyShop: ShopBranding | null;
}

const ShopProximityIndicator = ({ nearbyShop }: ShopProximityIndicatorProps) => {
  if (!nearbyShop || !nearbyShop.hasShop) return null;

  return (
    <div className="absolute bottom-24 sm:bottom-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none animate-pulse px-4 w-full max-w-xs sm:max-w-sm">
      <div className="bg-background/90 backdrop-blur-md border-2 border-primary rounded-xl px-4 sm:px-6 py-2 sm:py-3 shadow-lg flex items-center gap-2 sm:gap-3">
        <DoorOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
        <div className="text-center flex-1 min-w-0">
          <p className="text-foreground font-bold text-xs sm:text-sm truncate">{nearbyShop.shopName}</p>
          <p className="text-primary text-[10px] sm:text-xs font-medium">Click to Enter Shop</p>
        </div>
      </div>
    </div>
  );
};

export default ShopProximityIndicator;
