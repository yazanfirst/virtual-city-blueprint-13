import { useState } from 'react';
import { HelpCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MissionQuestion, useMissionStore } from '@/stores/missionStore';

interface QuestionModalProps {
  isOpen: boolean;
  question: MissionQuestion | null;
  onAnswer: (selectedAnswer: string) => void;
  onClose: () => void;
}

export default function QuestionModal({
  isOpen,
  question,
  onAnswer,
  onClose,
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
  
  if (!question) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md p-0 overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border-purple-500/50"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="bg-purple-900/50 px-6 py-4 border-b border-purple-500/30">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 border border-purple-500/40">
                <HelpCircle className="h-5 w-5 text-purple-400" />
              </div>
              <DialogTitle className="font-display text-lg font-bold text-white uppercase tracking-wider">
                Memory Test
              </DialogTitle>
            </div>
          </DialogHeader>
        </div>
        
        {/* Question */}
        <div className="p-6 space-y-6">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <p className="text-white text-base font-medium leading-relaxed">
              {question.questionText}
            </p>
          </div>
          
          {/* Options */}
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !hasAnswered && setSelectedOption(option)}
                disabled={hasAnswered}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 ${
                  selectedOption === option
                    ? 'bg-purple-600/30 border-purple-500 text-white'
                    : 'bg-slate-800/30 border-slate-700/50 text-slate-300 hover:bg-slate-700/30 hover:border-slate-600'
                } ${hasAnswered ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === option
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-slate-500'
                  }`}>
                    {selectedOption === option && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-sm">{option}</span>
                </div>
              </button>
            ))}
          </div>
          
          {/* Warning */}
          <div className="flex items-center gap-2 text-amber-400/80 text-xs">
            <AlertTriangle className="h-3 w-3" />
            <span>Choose carefully. Wrong answers have consequences.</span>
          </div>
          
          {/* Confirm Button */}
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleConfirm}
            disabled={!selectedOption || hasAnswered}
          >
            Confirm Answer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
