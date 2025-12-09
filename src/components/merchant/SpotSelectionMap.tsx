import { SpotWithShop } from "@/hooks/useStreets";

interface SpotSelectionMapProps {
  spots: SpotWithShop[];
  selectedSpotId: string;
  onSelectSpot: (spotId: string) => void;
  highlightedSpotId?: string; // For external selection (e.g., from 3D view)
}

const SpotSelectionMap = ({ spots, selectedSpotId, onSelectSpot, highlightedSpotId }: SpotSelectionMapProps) => {
  // Group spots by their label prefix (L, R, N, S)
  const leftSpots = spots.filter(s => s.spot_label.startsWith('L')).sort((a, b) => a.sort_order - b.sort_order);
  const rightSpots = spots.filter(s => s.spot_label.startsWith('R')).sort((a, b) => a.sort_order - b.sort_order);
  const northSpots = spots.filter(s => s.spot_label.startsWith('N')).sort((a, b) => a.sort_order - b.sort_order);
  const southSpots = spots.filter(s => s.spot_label.startsWith('S')).sort((a, b) => a.sort_order - b.sort_order);

  const getSpotStatus = (spot: SpotWithShop) => {
    if (spot.id === selectedSpotId) return 'selected';
    if (spot.id === highlightedSpotId) return 'highlighted';
    if (!spot.shop) return 'available';
    // All shop statuses block the spot - including suspended and rejected
    if (spot.shop.status === 'pending_review') return 'pending';
    if (spot.shop.status === 'active') return 'taken';
    if (spot.shop.status === 'suspended') return 'taken'; // Suspended spots are still occupied
    if (spot.shop.status === 'rejected') return 'available'; // Only rejected becomes available again
    return 'available';
  };

  const getSpotColor = (status: string) => {
    switch (status) {
      case 'selected': return 'bg-primary border-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background';
      case 'highlighted': return 'bg-secondary/30 border-secondary text-secondary-foreground animate-pulse ring-2 ring-secondary';
      case 'available': return 'bg-green-500/20 border-green-500 text-green-400 hover:bg-green-500/30 cursor-pointer';
      case 'pending': return 'bg-yellow-500/20 border-yellow-500 text-yellow-400 cursor-not-allowed';
      case 'taken': return 'bg-red-500/20 border-red-500 text-red-400 cursor-not-allowed';
      default: return 'bg-muted border-border';
    }
  };

  const handleSpotClick = (spot: SpotWithShop) => {
    const status = getSpotStatus(spot);
    if (status === 'available' || status === 'selected' || status === 'highlighted') {
      onSelectSpot(spot.id);
    }
  };

  const SpotButton = ({ spot }: { spot: SpotWithShop }) => {
    const status = getSpotStatus(spot);
    const isHighlighted = spot.id === highlightedSpotId;
    
    return (
      <button
        onClick={() => handleSpotClick(spot)}
        disabled={status === 'taken' || status === 'pending'}
        className={`w-10 h-10 rounded border-2 font-display text-xs font-bold transition-all ${getSpotColor(status)} ${isHighlighted ? 'scale-110 z-10' : ''}`}
        title={`${spot.spot_label} - ${
          status === 'available' ? 'Available' : 
          status === 'taken' ? 'Occupied' : 
          status === 'pending' ? 'Pending Review' : 
          status === 'highlighted' ? 'Selected in 3D View' :
          'Selected'
        }${spot.shop?.name ? ` (${spot.shop.name})` : ''}`}
      >
        {spot.spot_label}
      </button>
    );
  };

  return (
    <div className="relative bg-muted/50 rounded-lg p-6 min-h-[400px]">
      {/* Legend */}
      <div className="absolute top-4 right-4 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500/50 border border-green-500" />
          <span className="text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500/50 border border-yellow-500" />
          <span className="text-muted-foreground">Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500/50 border border-red-500" />
          <span className="text-muted-foreground">Occupied</span>
        </div>
        {highlightedSpotId && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-secondary/50 border border-secondary animate-pulse" />
            <span className="text-muted-foreground">3D Selected</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center pt-8">
        {/* North Cross Street Shops */}
        <div className="flex gap-2 mb-4">
          {northSpots.slice(3).reverse().map(spot => (
            <SpotButton key={spot.id} spot={spot} />
          ))}
          <div className="w-6" />
          {northSpots.slice(0, 3).map(spot => (
            <SpotButton key={spot.id} spot={spot} />
          ))}
        </div>

        {/* Cross Street Label */}
        <div className="w-full max-w-md h-8 bg-muted rounded flex items-center justify-center mb-4">
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Cross Street</span>
        </div>

        {/* Main Boulevard with Left and Right shops */}
        <div className="flex items-start gap-4">
          {/* Left Shops */}
          <div className="flex flex-col gap-2">
            {leftSpots.map(spot => (
              <SpotButton key={spot.id} spot={spot} />
            ))}
          </div>

          {/* Main Road */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-48 bg-muted rounded relative">
              <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col items-center justify-center">
                <div className="w-0.5 h-full bg-border/50 absolute" />
                <span className="text-xs text-muted-foreground rotate-90 whitespace-nowrap">Main Boulevard</span>
              </div>
            </div>
            
            {/* Roundabout */}
            <div className="w-16 h-16 rounded-full border-4 border-muted bg-muted/50 flex items-center justify-center my-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40" />
            </div>

            <div className="w-16 h-48 bg-muted rounded relative">
              <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col items-center justify-center">
                <div className="w-0.5 h-full bg-border/50 absolute" />
              </div>
            </div>
          </div>

          {/* Right Shops */}
          <div className="flex flex-col gap-2">
            {rightSpots.map(spot => (
              <SpotButton key={spot.id} spot={spot} />
            ))}
          </div>
        </div>

        {/* South Cross Street Label */}
        <div className="w-full max-w-md h-8 bg-muted rounded flex items-center justify-center mt-4 mb-4">
          <span className="text-xs text-muted-foreground uppercase tracking-widest">Cross Street</span>
        </div>

        {/* South Cross Street Shops */}
        <div className="flex gap-2">
          {southSpots.slice(3).reverse().map(spot => (
            <SpotButton key={spot.id} spot={spot} />
          ))}
          <div className="w-6" />
          {southSpots.slice(0, 3).map(spot => (
            <SpotButton key={spot.id} spot={spot} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpotSelectionMap;
