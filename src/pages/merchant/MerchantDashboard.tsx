import { Link } from "react-router-dom";
import { LayoutDashboard, MapPin, Store, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const StatCard = ({ 
  title, 
  value, 
  icon: Icon 
}: { 
  title: string; 
  value: string; 
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <div className="cyber-card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
          {title}
        </p>
        <p className="font-display text-2xl font-bold text-foreground">
          {value}
        </p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
        <Icon className="h-6 w-6 text-primary" />
      </div>
    </div>
  </div>
);

const MerchantDashboard = () => {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 glow-primary">
                <LayoutDashboard className="h-5 w-5 text-primary" />
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Merchant Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground">
              Manage your shops and track performance
            </p>
          </div>

          <Button variant="cyber" asChild>
            <Link to="/merchant/streets">
              <MapPin className="mr-2 h-4 w-4" />
              Choose Street
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Shops" value="0" icon={Store} />
          <StatCard title="Total Visitors" value="0" icon={Users} />
          <StatCard title="Revenue" value="$0" icon={TrendingUp} />
          <StatCard title="Active Streets" value="1" icon={MapPin} />
        </div>

        {/* Quick Actions */}
        <div className="cyber-card">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/merchant/streets"
              className="flex items-center gap-3 p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-foreground">Browse Streets</span>
            </Link>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 cursor-not-allowed">
              <Store className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">Manage Shops</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 cursor-not-allowed">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">View Analytics</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantDashboard;
