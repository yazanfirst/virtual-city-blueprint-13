import { useState, useEffect } from 'react';
import { X, HelpCircle, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGameStore, Question } from '@/stores/gameStore';

export default function MemoryQuestionPopup() {
  const { currentQuestion, wrongAnswers, answerQuestion, closeQuestion } = useGameStore();
  const [showPattern, setShowPattern] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    if (currentQuestion?.pattern && currentQuestion.showTime) {
      setShowPattern(true);
      const timer = setTimeout(() => {
        setShowPattern(false);
      }, currentQuestion.showTime);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion]);

  useEffect(() => {
    // Reset state when question changes
    setSelectedAnswer(null);
    setAnswerResult(null);
  }, [currentQuestion?.id]);

  if (!currentQuestion) return null;

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index);
    const correct = answerQuestion(index);
    setAnswerResult(correct ? 'correct' : 'wrong');

    if (correct) {
      // Auto close after success
      setTimeout(() => {
        setAnswerResult(null);
        setSelectedAnswer(null);
      }, 1500);
    } else {
      // Reset after wrong answer (if not 3rd wrong)
      setTimeout(() => {
        setAnswerResult(null);
        setSelectedAnswer(null);
      }, 1000);
    }
  };

  const attemptsLeft = 3 - wrongAnswers;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto"
      style={{ zIndex: 300 }}
    >
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-[90vw] shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 border border-primary/30">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Mystery Box Challenge
              </h3>
              <p className="text-xs text-muted-foreground">
                Answer correctly to unlock the box!
              </p>
            </div>
          </div>
          <button 
            onClick={closeQuestion}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pattern Display Phase */}
        {showPattern && currentQuestion.pattern && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">Remember this pattern!</p>
            <div className="flex items-center justify-center gap-4 text-4xl">
              {currentQuestion.pattern.map((item, i) => (
                <span key={i} className="animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}>
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-4 w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-100"
                style={{ 
                  width: '100%',
                  animation: `shrink ${currentQuestion.showTime}ms linear forwards`
                }}
              />
            </div>
          </div>
        )}

        {/* Question Phase */}
        {!showPattern && (
          <>
            {/* Question */}
            <div className="bg-muted/50 rounded-xl p-4 mb-4 text-center">
              <p className="text-lg font-medium text-foreground">
                {currentQuestion.question}
              </p>
            </div>

            {/* Attempts Indicator */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <AlertTriangle className={`h-4 w-4 ${attemptsLeft <= 1 ? 'text-destructive' : 'text-muted-foreground'}`} />
              <span className={`text-sm ${attemptsLeft <= 1 ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} left
              </span>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  variant={
                    selectedAnswer === index
                      ? answerResult === 'correct'
                        ? 'default'
                        : 'destructive'
                      : 'outline'
                  }
                  className={`h-14 text-lg font-medium transition-all ${
                    selectedAnswer === index && answerResult === 'correct'
                      ? 'bg-green-500 hover:bg-green-600 border-green-500'
                      : ''
                  }`}
                  onClick={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                >
                  {option}
                  {selectedAnswer === index && answerResult === 'correct' && (
                    <CheckCircle className="ml-2 h-5 w-5" />
                  )}
                  {selectedAnswer === index && answerResult === 'wrong' && (
                    <XCircle className="ml-2 h-5 w-5" />
                  )}
                </Button>
              ))}
            </div>

            {/* Result Message */}
            {answerResult === 'wrong' && (
              <div className="mt-4 text-center">
                <p className="text-destructive font-medium animate-pulse">
                  {attemptsLeft > 0 ? 'Wrong! Try again!' : 'The box disappeared!'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
