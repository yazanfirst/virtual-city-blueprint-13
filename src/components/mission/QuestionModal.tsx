import { useState } from 'react';
import { HelpCircle, AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MissionQuestion } from '@/stores/missionStore';

interface QuestionModalProps {
  isOpen: boolean;
  question: MissionQuestion | null;
  onAnswer: (selectedAnswer: string) => void;
  onClose: () => void;
  onRecheck?: () => void; // New prop for re-check action
}

export default function QuestionModal({
  isOpen,
  question,
  onAnswer,
  onClose,
  onRecheck,
}: QuestionModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  
  const handleConfirm = () => {
    if (selectedOption) {
      setHasAnswered(true);
      onAnswer(selectedOption);
      // Reset for next question
      setTimeout(() => {
        setSelectedOption(null);
        setHasAnswered(false);
      }, 500);
    }
  };

  const handleRecheck = () => {
    if (onRecheck) {
      onRecheck();
    }
  };
  
  if (!question) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-[95vw] sm:max-w-md p-0 overflow-hidden max-h-[90svh] flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 border-purple-500/50"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="bg-purple-900/50 px-4 sm:px-6 py-3 sm:py-4 border-b border-purple-500/30">
          <DialogHeader>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-purple-500/20 border border-purple-500/40">
                <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
              </div>
              <DialogTitle className="font-display text-sm sm:text-lg font-bold text-white uppercase tracking-wider">
                Memory Test
              </DialogTitle>
            </div>
          </DialogHeader>
        </div>
        
        {/* Body (scrolls on landscape/small heights) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4 border border-slate-700/50">
            <p className="text-white text-sm sm:text-base font-medium leading-relaxed">
              {question.questionText}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <button
                key={index}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (!hasAnswered) setSelectedOption(option);
                }}
                disabled={hasAnswered}
                className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg border transition-all duration-200 touch-manipulation select-none ${
                  selectedOption === option
                    ? 'bg-purple-600/30 border-purple-500 text-white'
                    : 'bg-slate-800/30 border-slate-700/50 text-slate-300 hover:bg-slate-700/30 hover:border-slate-600'
                } ${hasAnswered ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedOption === option
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-slate-500'
                  }`}>
                    {selectedOption === option && (
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Warning */}
          <div className="flex items-center gap-2 text-amber-400/80 text-[10px] sm:text-xs">
            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
            <span>Choose carefully. Wrong answers have consequences.</span>
          </div>
        </div>

        {/* Buttons (fixed footer so it's always reachable, incl. landscape) */}
        <div className="shrink-0 border-t border-slate-800/60 bg-slate-950/90 backdrop-blur px-4 sm:px-6 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <div className="flex gap-2 sm:gap-3">
            {/* Re-check Button */}
            <Button
              variant="outline"
              className="flex-1 border-amber-500/50 text-amber-400 hover:bg-amber-900/30 text-xs sm:text-sm py-3 sm:py-4 touch-manipulation select-none active:scale-[0.98]"
              onPointerDown={(e) => {
                e.stopPropagation();
                if (!hasAnswered) handleRecheck();
              }}
              disabled={hasAnswered}
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Re-check
            </Button>
            
            {/* Submit Answer Button */}
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm py-3 sm:py-4 touch-manipulation select-none active:scale-[0.98]"
              onPointerDown={(e) => {
                e.stopPropagation();
                if (selectedOption && !hasAnswered) handleConfirm();
              }}
              disabled={!selectedOption || hasAnswered}
            >
              Submit Answer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
