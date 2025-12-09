import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, ChevronRight, MapPin, Store, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full" />
      
      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-16">
        <div className="text-center max-w-3xl mx-auto">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 glow-primary-strong mb-8 animate-float">
            <Building2 className="h-10 w-10 text-primary" />
          </div>

          {/* Title */}
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4 text-glow">
            Virtual Shop City
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-xl mx-auto">
            Explore 3D streets with real shops
          </p>

          {/* CTA Button */}
          <Button variant="hero" size="xl" asChild>
            <Link to="/city-map">
              Enter City
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          {/* Feature highlights */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { icon: MapPin, label: "Explore Streets" },
              { icon: Store, label: "Visit Shops" },
              { icon: Users, label: "Meet Others" },
            ].map((feature, index) => (
              <div
                key={feature.label}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50 border border-border transition-all duration-300 hover:border-primary/30 hover:bg-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <feature.icon className="h-6 w-6 text-primary" />
                <span className="text-sm text-muted-foreground">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
