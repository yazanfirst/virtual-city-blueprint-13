import { Link } from "react-router-dom";
import { Shirt, UtensilsCrossed, Cpu, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";

interface StreetCardProps {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  showEnterButton?: boolean;
  onAction?: () => void;
  actionLabel?: string;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  fashion: Shirt,
  food: UtensilsCrossed,
  tech: Cpu,
};

const StreetCard = ({ 
  id, 
  name, 
  category, 
  isActive, 
  showEnterButton = true,
  onAction,
  actionLabel = "Enter"
}: StreetCardProps) => {
  const Icon = categoryIcons[id] || Shirt;

  return (
    <div className="cyber-card group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 transition-all duration-300 group-hover:glow-primary">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <StatusBadge status={isActive ? "active" : "coming-soon"} />
      </div>

      <h3 className="font-display text-xl font-bold text-foreground mb-1">
        {name}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 uppercase tracking-wider">
        {category}
      </p>

      {showEnterButton && (
        isActive ? (
          onAction ? (
            <Button 
              variant="cyber" 
              className="w-full" 
              onClick={onAction}
            >
              {actionLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button variant="cyber" className="w-full" asChild>
              <Link to={`/city/${id}`}>
                {actionLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )
        ) : (
          <Button variant="disabled" className="w-full" disabled>
            Coming Soon
          </Button>
        )
      )}
    </div>
  );
};

export default StreetCard;
