import { useEffect, useState } from "react";
import { X, Move, MousePointer, Store, LogOut, Target, AlertTriangle, Eye, Coins } from "lucide-react";
import { TutorialStep } from "@/hooks/useTutorialProgress";
import { Button } from "@/components/ui/button";

interface TutorialTooltipProps {
  step: TutorialStep;
  onDismiss: () => void;
}

const tutorialContent: Record<TutorialStep, {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  hint: string;
  position: 'center' | 'bottom' | 'top-left' | 'top-right' | 'bottom-center';
}> = {
  movement: {
    icon: Move,
    title: "Welcome to the Street!",
    description: "Use WASD or Arrow Keys to move around. Hold Left Click and drag to rotate the camera. Press Space to jump! Walk up to any shop and click to enter and explore inside!",
    hint: "Tap anywhere to continue",
    position: 'center',
  },
  shop_nearby: {
    icon: Store,
    title: "Shop Nearby!",
    description: "You're close to a shop! Click on it to enter and explore what's inside.",
    hint: "Click on the shop to enter",
    position: 'bottom-center',
  },
  shop_inside: {
    icon: LogOut,
    title: "Welcome to the Shop!",
    description: "Look around and explore the products on display! You can browse items, check prices, and visit the shop's website. When you're done, click the EXIT button at the top right.",
    hint: "Exit button is at the top right",
    position: 'top-right',
  },
  shop_exit_missions: {
    icon: Coins,
    title: "Want More Coins?",
    description: "Great job exploring! Want to earn coins and get discounts? Click the MISSION button on the left side of your screen to start a mission!",
    hint: "Look for the Mission button on the left",
    position: 'top-left',
  },
  mission_activated: {
    icon: Target,
    title: "Mission Started!",
    description: "Zombies will start chasing you! Run to the TARGET SHOP shown in green. Avoid fire pits, swinging axes, and thorns along the way. Press SPACE to jump over obstacles!",
    hint: "Find and run to the target shop!",
    position: 'center',
  },
  mission_escape: {
    icon: AlertTriangle,
    title: "Escape Phase!",
    description: "Zombies are chasing you! Run to the TARGET SHOP shown in the mission panel. Avoid fire pits, swinging axes, and thorns! Press SPACE to jump over obstacles.",
    hint: "Look for the target shop name",
    position: 'center',
  },
  mission_observation: {
    icon: Eye,
    title: "You Made It!",
    description: "You're inside the target shop! Now look around carefully - remember the items, their names, and prices. When you're ready, click the EXIT button at the top right to answer questions!",
    hint: "Click EXIT when ready to answer questions",
    position: 'top-right',
  },
  // mission_question tutorial removed - questions appear directly without instruction popup
};

const TutorialTooltip = ({ step, onDismiss }: TutorialTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const content = tutorialContent[step];
  const Icon = content.icon;

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  // Position classes based on content.position
  const positionClasses: Record<string, string> = {
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    bottom: "bottom-24 left-1/2 -translate-x-1/2",
    "top-left": "top-20 left-4",
    "top-right": "top-20 right-4",
    "bottom-center": "bottom-32 left-1/2 -translate-x-1/2",
  };

  return (
    <div 
      className="fixed inset-0 z-[200] pointer-events-auto"
      onClick={handleDismiss}
    >
      {/* Semi-transparent backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible && !isExiting ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* Tooltip card - Mobile optimized */}
      <div 
        className={`absolute ${positionClasses[content.position]} transition-all duration-300 w-full px-4 sm:px-0 sm:w-auto ${
          isVisible && !isExiting 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-background/95 backdrop-blur-lg border-2 border-primary/50 rounded-xl p-4 sm:p-5 shadow-2xl max-w-[90vw] sm:max-w-sm mx-auto">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 sm:h-6 sm:w-6"
            onClick={handleDismiss}
          >
            <X className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>

          {/* Icon with glow */}
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-lg animate-pulse" />
              <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/20 border-2 border-primary">
                <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-display text-base sm:text-lg font-bold text-foreground text-center mb-2">
            {content.title}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground text-xs sm:text-sm text-center mb-3 sm:mb-4 leading-relaxed">
            {content.description}
          </p>

          {/* Hint */}
          <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-primary/80">
            <MousePointer className="h-3 w-3 animate-bounce" />
            <span>{content.hint}</span>
          </div>

          {/* Got it button */}
          <Button
            variant="cyber"
            size="sm"
            className="w-full mt-3 sm:mt-4 text-sm"
            onClick={handleDismiss}
          >
            Got it!
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TutorialTooltip;