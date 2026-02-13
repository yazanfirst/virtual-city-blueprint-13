import { ShopBranding } from "@/hooks/use3DShops";
import { DoorOpen } from "lucide-react";

interface ShopProximityIndicatorProps {
  nearbyShop: ShopBranding | null;
  onPress?: () => void;
}

const ShopProximityIndicator = ({ nearbyShop, onPress }: ShopProximityIndicatorProps) => {
  if (!nearbyShop || !nearbyShop.hasShop) return null;

  return (
    <div 
      className="absolute bottom-24 sm:bottom-20 landscape:bottom-4 left-1/2 transform -translate-x-1/2 px-4 w-full max-w-xs sm:max-w-sm landscape:max-w-xs pointer-events-auto"
      style={{ zIndex: 300 }}
      data-control-ignore="true"
    >
      <button
        type="button"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onPress?.();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onPress?.();
        }}
        className="w-full touch-manipulation select-none active:scale-[0.98]"
        aria-label={`Enter ${nearbyShop.shopName}`}
      >
        <div className="animate-pulse bg-background/95 backdrop-blur-md border-2 border-primary rounded-xl px-4 sm:px-6 landscape:px-3 py-4 sm:py-4 landscape:py-2 shadow-lg flex items-center gap-3 sm:gap-4 landscape:gap-2">
          <DoorOpen className="h-7 w-7 sm:h-7 sm:w-7 landscape:h-5 landscape:w-5 text-primary flex-shrink-0" />
          <div className="text-center flex-1 min-w-0">
            <p className="text-foreground font-bold text-base sm:text-base landscape:text-sm truncate">{nearbyShop.shopName}</p>
            <p className="text-primary text-sm sm:text-sm landscape:text-xs font-medium">Tap to Enter Shop</p>
          </div>
        </div>
      </button>
    </div>
  );
};

export default ShopProximityIndicator;
