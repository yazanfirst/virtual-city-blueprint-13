import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Gamepad2,
  Store,
  Coins,
  Ghost,
  Skull,
  BarChart3,
  Users,
  Zap,
  Play,
  Star,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

const Marketing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/virtual-city-logo.svg"
              alt="Virtual Shop City"
              className="h-10 w-10 rounded-lg border border-primary/30"
            />
            <span className="font-display text-lg font-bold text-primary tracking-wide">
              Virtual Shop City
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth">Open a Shop</Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/city-map">
                Enter City
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-24 md:py-36 px-4">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-primary/8 blur-[140px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-8">
            <Zap className="h-4 w-4" />
            Now Live — Fashion Street is Open
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 text-glow">
            Don't Scroll.
            <br />
            <span className="text-primary">Get In.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Virtual Shop City is a browser-based 3D world where you explore real branded
            storefronts, complete missions, earn coins, and redeem{" "}
            <strong className="text-foreground">real discount coupons</strong> — no download required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" asChild>
              <Link to="/city-map">
                Enter City
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="cyber" size="lg" asChild>
              <a href="#merchants">I'm a Merchant</a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── DEMO VIDEO ── */}
      <section className="relative py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-10 text-glow">
            See It in Action
          </h2>
          <div className="relative aspect-video rounded-xl border border-border bg-card overflow-hidden group cursor-pointer">
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/60 backdrop-blur-sm transition-all group-hover:bg-muted/40">
              <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center glow-primary-strong mb-4 transition-transform group-hover:scale-110">
                <Play className="h-8 w-8 text-primary ml-1" />
              </div>
              <p className="text-muted-foreground text-sm">Demo Video Coming Soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (Players) ── */}
      <section className="py-16 md:py-24 px-4" id="players">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-display uppercase tracking-widest mb-4">
              <Gamepad2 className="h-3.5 w-3.5" />
              For Players
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-glow">
              Play. Earn. Save Money.
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Explore Fashion Street in 3D, complete missions, and use your earned coins to
              unlock real coupons from real brands.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Store,
                title: "Explore Shops",
                desc: "Walk into real branded storefronts and browse actual products on showcase walls.",
              },
              {
                icon: Skull,
                title: "Survive & Answer",
                desc: "Escape zombies, dodge traps, reach the target shop — then answer questions about what you found.",
              },
              {
                icon: Ghost,
                title: "Hunt Ghosts",
                desc: "Use your flashlight to reveal and capture ghosts hiding in the darkness. Watch out for jumpscares.",
              },
              {
                icon: Coins,
                title: "Redeem Coupons",
                desc: "Spend earned coins on real discount codes from the merchants on the street.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="cyber-card flex flex-col items-center text-center gap-3"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button variant="hero" size="lg" asChild>
              <Link to="/city-map">
                Start Playing Now
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── MISSIONS BREAKDOWN ── */}
      <section className="py-16 md:py-24 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12 text-glow">
            3 Mission Types. Unlimited Fun.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Skull,
                title: "Zombie Escape",
                desc: "Zombies invade Fashion Street. Escape them, dodge fire pits, swinging axes, and thorns. Reach the target shop, then answer questions about what's inside to complete the mission.",
                color: "text-destructive",
              },
              {
                icon: Ghost,
                title: "Ghost Hunt",
                desc: "Use your EMF detector to locate invisible ghosts, reveal them with your flashlight, and capture them before time runs out. Watch out for jumpscares.",
                color: "text-secondary",
              },
              {
                icon: Zap,
                title: "Mirror World",
                desc: "The street flips into a dark twisted dimension. Find reality anchors to escape before time runs out. Avoid mirror shadows that stalk you.",
                color: "text-accent",
              },
            ].map((m) => (
              <div key={m.title} className="cyber-card flex flex-col gap-4 items-center text-center">
                <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center">
                  <m.icon className={`h-6 w-6 ${m.color}`} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold mb-2">{m.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR MERCHANTS ── */}
      <section className="py-16 md:py-24 px-4 border-t border-border" id="merchants">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-secondary/30 bg-secondary/5 text-secondary text-xs font-display uppercase tracking-widest mb-4">
              <Store className="h-3.5 w-3.5" />
              For Merchants
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold">
              Your Brand. <span className="text-secondary">In 3D.</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Rent a spot on Fashion Street and get a fully branded 3D storefront.
              Players are literally required to explore your shop to complete missions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Store,
                title: "Branded Storefront",
                desc: "Your logo, colors, facade style & products displayed in a 3D shop that players walk into.",
              },
              {
                icon: Users,
                title: "Guaranteed Foot Traffic",
                desc: "Mission quizzes force every player to enter and explore your shop to find answers.",
              },
              {
                icon: Coins,
                title: "Offer & Coupon System",
                desc: "Create discount offers players buy with in-game coins — driving real conversions to your store.",
              },
              {
                icon: BarChart3,
                title: "Analytics Dashboard",
                desc: "Track visits, link clicks, offer redemptions, and shop ratings in real-time.",
              },
              {
                icon: ShieldCheck,
                title: "Admin Review",
                desc: "Every shop goes through quality review before going live — maintaining street quality.",
              },
              {
                icon: TrendingUp,
                title: "Growing Player Base",
                desc: "As we add more streets and missions, your storefront gets more exposure over time.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="relative overflow-hidden rounded-lg border border-border bg-card p-6 transition-all duration-300 hover:border-secondary/50"
                style={{ boxShadow: "none" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 0 20px hsl(270 60% 60% / 0.2)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <f.icon className="h-8 w-8 text-secondary mb-3" />
                <h3 className="font-display text-lg font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button variant="secondary" size="lg" asChild>
              <Link to="/auth">
                Open a Shop
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF / STATS ── */}
      <section className="py-16 md:py-20 px-4 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { value: "Free", label: "To Play" },
              { value: "100%", label: "Browser-Based" },
              { value: "Real", label: "Discount Coupons" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-display text-3xl md:text-4xl font-bold text-primary text-glow">
                  {s.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-20 md:py-28 px-4 border-t border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <Star className="h-10 w-10 text-primary mx-auto mb-6 animate-pulse" />
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-glow">
            Fashion Street is Live Now
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Walk in, explore the shops, complete missions, and start earning real rewards.
            No download. No signup required to explore.
          </p>
          <Button variant="hero" size="xl" asChild>
            <Link to="/city-map">
              Enter City
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Marketing;
