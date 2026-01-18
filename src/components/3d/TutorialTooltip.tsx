import { useEffect, useState } from "react";
import { X, Move, MousePointer, Store, LogOut, Target, Brain, AlertTriangle, Eye } from "lucide-react";
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
    title: "Movement Controls",
    description: "Use WASD or Arrow Keys to move your character around the street. Hold Left Click and drag to rotate the camera. Press Space to jump!",
    hint: "Tap anywhere to continue",
    position: 'center',
  },
  mission_start: {
    icon: Target,
    title: "Start a Mission",
    description: "Click 'Activate Mission' to begin! You'll need to escape zombies, reach the target shop, memorize items inside, then answer questions about what you saw.",
    hint: "Click Activate Mission to begin",
    position: 'center',
  },
  shop_nearby: {
    icon: Store,
    title: "Enter Shop",
    description: "You're near a shop! Click on it to enter and explore the products inside.",
    hint: "Get close to shops to enter them",
    position: 'bottom-center',
  },
  shop_inside: {
    icon: LogOut,
    title: "Inside the Shop",
    description: "Browse the products on display. Look around to see what's available. Click the Exit button at the top when you're ready to leave.",
    hint: "Exit button is at the top right",
    position: 'top-right',
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
    title: "Memorize Everything!",
    description: "You're safe inside the target shop! Study the items carefully - their names, prices, and positions. You'll be tested when you exit!",
    hint: "Click Exit when ready to answer questions",
    position: 'center',
  },
  mission_question: {
    icon: Brain,
    title: "Memory Test",
    description: "Answer questions about what you saw in the shop. Get all answers correct to complete the mission. One wrong answer and the zombies will find you!",
    hint: "Think carefully before answering",
    position: 'center',
  },
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
      
      {/* Tooltip card */}
      <div 
        className={`absolute ${positionClasses[content.position]} transition-all duration-300 ${
          isVisible && !isExiting 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-background/95 backdrop-blur-lg border-2 border-primary/50 rounded-xl p-5 shadow-2xl max-w-sm mx-4">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Icon with glow */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-lg animate-pulse" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 border-2 border-primary">
                <Icon className="h-7 w-7 text-primary" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-display text-lg font-bold text-foreground text-center mb-2">
            {content.title}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground text-sm text-center mb-4 leading-relaxed">
            {content.description}
          </p>

          {/* Hint */}
          <div className="flex items-center justify-center gap-2 text-xs text-primary/80">
            <MousePointer className="h-3 w-3 animate-bounce" />
            <span>{content.hint}</span>
          </div>

          {/* Got it button */}
          <Button
            variant="cyber"
            size="sm"
            className="w-full mt-4"
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
