import { Link } from "react-router-dom";
import demoVideo from "@/assets/demo-video.mp4";
import Logo from "@/components/Logo";
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
  Star,
  ShieldCheck,
  TrendingUp,
  Sparkles,
} from "lucide-react";

const Marketing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
          <Logo />
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
      <section className="relative overflow-hidden py-20 md:py-28 px-4">
        {/* Background layers */}
        <div className="absolute inset-0 bg-grid opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[700px] bg-primary/10 blur-[160px] rounded-full pointer-events-none animate-pulse-slow" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] bg-secondary/8 blur-[120px] rounded-full pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />

        {/* Floating accent orbs */}
        <div className="absolute top-20 right-[15%] w-2 h-2 rounded-full bg-primary/60 animate-float" />
        <div className="absolute top-40 left-[10%] w-1.5 h-1.5 rounded-full bg-secondary/50 animate-float-delayed" />
        <div className="absolute bottom-32 right-[25%] w-1 h-1 rounded-full bg-primary/40 animate-float" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-8 backdrop-blur-sm">
            <Zap className="h-4 w-4 animate-pulse" />
            Now Live — Fashion Street is Open
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-5 text-glow-strong">
            From Scroll
            <br />
            <span className="text-primary">to Stroll.</span>
          </h1>

          <p className="font-display text-xl md:text-2xl lg:text-3xl font-semibold text-foreground/85 mb-6">
            Walk the city. Play the shops. Earn real rewards.
          </p>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Virtual Shop City is a browser-based 3D world where you walk through real branded
            streets, complete missions, earn coins, and redeem{" "}
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
      <section className="relative py-10 md:py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-xs font-display uppercase tracking-widest text-primary/70">Preview</span>
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-10 text-glow">
            See It in Action
          </h2>
          <div className="relative aspect-video rounded-2xl border border-primary/20 bg-card overflow-hidden video-glow">
            <video
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              src={demoVideo}
            />
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/50 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/50 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/50 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/50 rounded-br-2xl" />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (Players) ── */}
      <section className="py-20 md:py-28 px-4 border-t section-divider" id="players">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-display uppercase tracking-widest mb-4">
              <Gamepad2 className="h-3.5 w-3.5" />
              For Players
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-glow">
              Play. Earn. Save Money.
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto leading-relaxed">
              Explore Fashion Street in 3D, complete missions, and use your earned coins to
              unlock real coupons from real brands.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Store,
                title: "Explore Shops",
                desc: "Walk into real branded storefronts and browse actual products on showcase walls.",
                delay: 0,
              },
              {
                icon: Skull,
                title: "Survive & Answer",
                desc: "Escape zombies, dodge traps, reach the target shop — then answer questions about what you found.",
                delay: 1,
              },
              {
                icon: Ghost,
                title: "Hunt Ghosts",
                desc: "Use your flashlight to reveal and capture ghosts hiding in the darkness. Watch out for jumpscares.",
                delay: 2,
              },
              {
                icon: Coins,
                title: "Redeem Coupons",
                desc: "Spend earned coins on real discount codes from the merchants on the street.",
                delay: 3,
              },
            ].map((f) => (
              <div
                key={f.title}
                className="cyber-card flex flex-col items-center text-center gap-4 group"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110 group-hover:border-primary/40">
                  <f.icon className="h-7 w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
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
      <section className="py-20 md:py-28 px-4 border-t section-divider">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4 text-glow">
            3 Mission Types. Unlimited Fun.
          </h2>
          <p className="text-muted-foreground text-center max-w-lg mx-auto mb-14">
            Each mission pushes you into the shops — that's how you discover the brands and earn rewards.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Skull,
                title: "Zombie Escape",
                desc: "Zombies invade Fashion Street. Escape them, dodge fire pits, swinging axes, and thorns. Reach the target shop, then answer questions about what's inside to complete the mission.",
                color: "text-destructive",
                borderHover: "hover:border-destructive/40",
                glow: "hover:shadow-[0_0_30px_hsl(0_84%_60%/0.15)]",
              },
              {
                icon: Ghost,
                title: "Ghost Hunt",
                desc: "Use your EMF detector to locate invisible ghosts, reveal them with your flashlight, and capture them before time runs out. Watch out for jumpscares.",
                color: "text-secondary",
                borderHover: "hover:border-secondary/40",
                glow: "hover:shadow-[0_0_30px_hsl(270_60%_60%/0.15)]",
              },
              {
                icon: Zap,
                title: "Mirror World",
                desc: "The street flips into a dark twisted dimension. Find reality anchors to escape before time runs out. Avoid mirror shadows that stalk you.",
                color: "text-accent",
                borderHover: "hover:border-accent/40",
                glow: "hover:shadow-[0_0_30px_hsl(174_72%_40%/0.15)]",
              },
            ].map((m) => (
              <div
                key={m.title}
                className={`relative overflow-hidden rounded-xl border border-border bg-card p-7 flex flex-col gap-5 items-center text-center transition-all duration-500 ${m.borderHover} ${m.glow} group`}
              >
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-border to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <m.icon className={`h-7 w-7 ${m.color} transition-transform duration-300`} />
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
      <section className="py-20 md:py-28 px-4 border-t section-divider" id="merchants">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-secondary/30 bg-secondary/5 text-secondary text-xs font-display uppercase tracking-widest mb-4">
              <Store className="h-3.5 w-3.5" />
              For Merchants
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold">
              Your Brand. <span className="text-secondary text-glow-secondary">In 3D.</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto leading-relaxed">
              Rent a spot on Fashion Street and get a fully branded 3D storefront.
              Players are literally required to explore your shop to complete missions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                className="relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-500 hover:border-secondary/40 hover:shadow-[0_0_30px_hsl(270_60%_60%/0.12)] group"
              >
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-secondary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-secondary/20 group-hover:scale-105">
                  <f.icon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
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
      <section className="py-20 md:py-24 px-4 border-t section-divider">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: "Free", label: "To Play", icon: Sparkles },
              { value: "100%", label: "Browser-Based", icon: Zap },
              { value: "Real", label: "Discount Coupons", icon: Coins },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-2">
                <s.icon className="h-5 w-5 text-primary/50 mb-1" />
                <div className="font-display text-3xl md:text-5xl font-bold text-primary text-glow-strong">
                  {s.value}
                </div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-24 md:py-32 px-4 border-t section-divider overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/8 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/6 blur-[140px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <Star className="h-12 w-12 text-primary mx-auto mb-8 animate-pulse" />
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 text-glow-strong">
            Fashion Street is Live Now
          </h2>
          <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
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
