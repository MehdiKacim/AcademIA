import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, ArrowRight, RefreshCw } from "lucide-react";
import { QuizQuestion } from "@/lib/courseData";
import { cn } from "@/lib/utils";

interface QuizComponentProps {
  questions: QuizQuestion[];
  onQuizComplete: (score: number, total: number) => void;
}

const QuizComponent = ({ questions, onQuizComplete }: QuizComponentProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (value: string) => {
    setSelectedOption(value);
    setFeedback(null); // Clear feedback when a new option is selected
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) {
      setFeedback({ isCorrect: false, message: "Veuillez sélectionner une réponse." });
      return;
    }

    const correctOption = currentQuestion.options.find(opt => opt.isCorrect);
    const isCorrect = selectedOption === correctOption?.text;

    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
      setFeedback({ isCorrect: true, message: "Bonne réponse !" });
    } else {
      setFeedback({ isCorrect: false, message: `Mauvaise réponse. La bonne réponse était : ${correctOption?.text}` });
    }

    setShowResult(true);
  };

  const handleNextQuestion = () => {
    setShowResult(false);
    setFeedback(null);
    setSelectedOption(null);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      setQuizCompleted(true);
      onQuizComplete(score, questions.length);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setShowResult(false);
    setFeedback(null);
    setQuizCompleted(false);
  };

  if (quizCompleted) {
    return (
      <Card className="p-6 text-center">
        <CardTitle className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Quiz Terminé !
        </CardTitle>
        <CardDescription className="text-lg text-muted-foreground mb-6">
          Votre score : {score} / {questions.length}
        </CardDescription>
        <Button onClick={handleRestartQuiz}>
          <RefreshCw className="h-4 w-4 mr-2" /> Recommencer le Quiz
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <CardHeader className="mb-4">
        <CardTitle className="text-2xl">Question {currentQuestionIndex + 1} / {questions.length}</CardTitle>
        <CardDescription className="text-lg font-medium">{currentQuestion.question}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup onValueChange={handleOptionSelect} value={selectedOption} disabled={showResult}>
          {currentQuestion.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={option.text} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`} className={cn(
                "flex-grow p-3 rounded-md border cursor-pointer",
                showResult && option.isCorrect && "border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300",
                showResult && !option.isCorrect && selectedOption === option.text && "border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300",
                !showResult && "hover:bg-accent hover:text-accent-foreground"
              )}>
                {option.text}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {feedback && (
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-md",
            feedback.isCorrect ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}>
            {feedback.isCorrect ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            <p className="text-sm">{feedback.message}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          {!showResult ? (
            <Button onClick={handleSubmitAnswer} disabled={selectedOption === null}>
              Soumettre la réponse
            </Button>
          ) : (
            <Button onClick={handleNextQuestion}>
              {currentQuestionIndex < questions.length - 1 ? "Question Suivante" : "Voir les Résultats"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizComponent;