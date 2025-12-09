import { Link, useLocation } from "react-router-dom";
import { Building2, Map, User } from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const location = useLocation();

  const navLinks = [
    { href: "/city-map", label: "City Map", icon: Map },
    { href: "/merchant/login", label: "Merchant Login", icon: User },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link 
          to="/" 
          className="flex items-center gap-3 transition-all duration-300 hover:opacity-80"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 glow-primary">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display text-xl font-bold tracking-wider text-foreground">
            Virtual Shop City
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href || 
                            location.pathname.startsWith(link.href.replace('/login', ''));
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
