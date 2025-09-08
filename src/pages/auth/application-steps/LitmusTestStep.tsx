import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TestTube,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { ApplicationData } from '../ApplicationProcess';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface LitmusTestStepProps {
  data: ApplicationData;
  onComplete: (data: Partial<ApplicationData>) => void;
  onSave: (data: Partial<ApplicationData>) => void;
  saving: boolean;
}

interface Question {
  id: string;
  question: string;
  type: 'multiple-choice' | 'single-choice' | 'text' | 'code';
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
}

const LitmusTestStep = ({
  data,
  onComplete,
  onSave,
  saving,
}: LitmusTestStepProps) => {
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const [testCompleted, setTestCompleted] = useState(
    data.litmusTest?.completed || false
  );
  const [testScore, setTestScore] = useState(data.litmusTest?.score || 0);

  // Sample questions - in a real app, these would come from an API
  const questions: Question[] = [
    {
      id: '1',
      question:
        'What is the primary purpose of version control systems like Git?',
      type: 'single-choice',
      options: [
        'To store files on a remote server',
        'To track changes in code over time and collaborate with others',
        'To compile and run programs',
        'To debug applications',
      ],
      correctAnswer:
        'To track changes in code over time and collaborate with others',
      points: 10,
    },
    {
      id: '2',
      question:
        'Which of the following are benefits of using React? (Select all that apply)',
      type: 'multiple-choice',
      options: [
        'Component reusability',
        'Virtual DOM for better performance',
        'Built-in state management',
        'One-way data flow',
        'Automatic testing',
      ],
      correctAnswer: [
        'Component reusability',
        'Virtual DOM for better performance',
        'One-way data flow',
      ],
      points: 15,
    },
    {
      id: '3',
      question:
        'Explain the concept of closures in JavaScript. Provide a simple example.',
      type: 'text',
      points: 20,
    },
    {
      id: '4',
      question:
        'Write a function that takes an array of numbers and returns the sum of all even numbers.',
      type: 'code',
      points: 25,
    },
    {
      id: '5',
      question: 'What is the time complexity of binary search?',
      type: 'single-choice',
      options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
      correctAnswer: 'O(log n)',
      points: 10,
    },
  ];

  const totalQuestions = questions.length;
  const totalTime = 30 * 60; // 30 minutes

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (testStarted && !testCompleted && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTestSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [testStarted, testCompleted, timeRemaining]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleTestStart = () => {
    setTestStarted(true);
    setTimeRemaining(totalTime);
    setCurrentQuestion(0);
    setAnswers({});
  };

  const handleTestSubmit = () => {
    // Calculate score
    let score = 0;
    questions.forEach(question => {
      const userAnswer = answers[question.id];
      if (userAnswer) {
        if (question.type === 'multiple-choice') {
          const correctAnswers = question.correctAnswer as string[];
          const userAnswers = Array.isArray(userAnswer)
            ? userAnswer
            : [userAnswer];
          const isCorrect =
            correctAnswers.every(correct => userAnswers.includes(correct)) &&
            userAnswers.every(user => correctAnswers.includes(user));
          if (isCorrect) score += question.points;
        } else if (question.type === 'single-choice') {
          if (userAnswer === question.correctAnswer) {
            score += question.points;
          }
        } else {
          // For text and code questions, give partial credit
          score += question.points * 0.5;
        }
      }
    });

    const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = Math.round((score / maxScore) * 100);

    setTestScore(percentage);
    setTestCompleted(true);
    setTestStarted(false);

    // Save test results
    onComplete({
      litmusTest: {
        completed: true,
        score: percentage,
        answers: answers,
      },
    });

    toast.success(`Test completed! Your score: ${percentage}%`);
  };

  const handleRetakeTest = () => {
    setTestCompleted(false);
    setTestStarted(false);
    setCurrentQuestion(0);
    setAnswers({});
    setTestScore(0);
  };

  const renderQuestion = () => {
    const question = questions[currentQuestion];
    if (!question) return null;

    return (
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-lg'>
              Question {currentQuestion + 1} of {totalQuestions}
            </CardTitle>
            <Badge variant='secondary'>{question.points} points</Badge>
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='text-lg font-medium'>{question.question}</div>

          {question.type === 'single-choice' && (
            <div className='space-y-3'>
              {question.options?.map((option, index) => (
                <label
                  key={index}
                  className='flex items-center space-x-3 cursor-pointer'
                >
                  <input
                    type='radio'
                    name={`question-${question.id}`}
                    value={option}
                    checked={answers[question.id] === option}
                    onChange={e =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    className='h-4 w-4 text-primary'
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === 'multiple-choice' && (
            <div className='space-y-3'>
              {question.options?.map((option, index) => (
                <label
                  key={index}
                  className='flex items-center space-x-3 cursor-pointer'
                >
                  <input
                    type='checkbox'
                    checked={answers[question.id]?.includes(option) || false}
                    onChange={e => {
                      const currentAnswers = answers[question.id] || [];
                      if (e.target.checked) {
                        handleAnswerChange(question.id, [
                          ...currentAnswers,
                          option,
                        ]);
                      } else {
                        handleAnswerChange(
                          question.id,
                          currentAnswers.filter((a: string) => a !== option)
                        );
                      }
                    }}
                    className='h-4 w-4 text-primary'
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === 'text' && (
            <textarea
              value={answers[question.id] || ''}
              onChange={e => handleAnswerChange(question.id, e.target.value)}
              className='w-full h-32 p-3 border border-gray-300 rounded-md resize-none'
              placeholder='Type your answer here...'
            />
          )}

          {question.type === 'code' && (
            <div className='space-y-2'>
              <textarea
                value={answers[question.id] || ''}
                onChange={e => handleAnswerChange(question.id, e.target.value)}
                className='w-full h-40 p-3 border border-gray-300 rounded-md font-mono text-sm resize-none'
                placeholder='Write your code here...'
              />
              <p className='text-sm text-muted-foreground'>
                You can write in any programming language. Make sure to include
                proper syntax.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className='flex justify-between pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            <div className='flex space-x-2'>
              {currentQuestion < totalQuestions - 1 ? (
                <Button type='button' onClick={handleNextQuestion}>
                  Next
                </Button>
              ) : (
                <Button
                  type='button'
                  onClick={handleTestSubmit}
                  className='bg-green-600 hover:bg-green-700'
                >
                  Submit Test
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (testCompleted) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <CheckCircle className='h-5 w-5 text-green-600' />
              <span>LITMUS Test Completed</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='text-center'>
              <div className='text-4xl font-bold text-green-600 mb-2'>
                {testScore}%
              </div>
              <p className='text-lg text-muted-foreground'>
                Your LITMUS Test Score
              </p>
            </div>

            <Alert>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                Your test results have been submitted and will be reviewed by
                our team. You will be notified about the next steps in your
                application process.
              </AlertDescription>
            </Alert>

            <div className='flex justify-center space-x-4'>
              <Button
                variant='outline'
                onClick={handleRetakeTest}
                className='flex items-center space-x-2'
              >
                <RotateCcw className='h-4 w-4' />
                <span>Retake Test</span>
              </Button>
              <Button
                onClick={() => onComplete({})}
                className='flex items-center space-x-2'
              >
                <CheckCircle className='h-4 w-4' />
                <span>Complete Application</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <TestTube className='h-5 w-5' />
              <span>LITMUS Test</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='text-center'>
              <div className='text-6xl mb-4'>🧪</div>
              <h3 className='text-2xl font-bold mb-2'>
                Ready for the LITMUS Test?
              </h3>
              <p className='text-muted-foreground mb-6'>
                This assessment will evaluate your technical knowledge and
                problem-solving skills.
              </p>
            </div>

            <Card className='bg-blue-50 border-blue-200'>
              <CardContent className='pt-6'>
                <h4 className='font-medium mb-4'>Test Details</h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                  <div className='flex items-center space-x-2'>
                    <Clock className='h-4 w-4' />
                    <span>Duration: 30 minutes</span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <TestTube className='h-4 w-4' />
                    <span>Questions: {totalQuestions}</span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <CheckCircle className='h-4 w-4' />
                    <span>Types: Multiple choice, coding, text</span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <AlertCircle className='h-4 w-4' />
                    <span>Auto-submit when time expires</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                <strong>Important:</strong> Once you start the test, the timer
                will begin and cannot be paused. Make sure you have a stable
                internet connection and won't be interrupted.
              </AlertDescription>
            </Alert>

            <div className='flex justify-center'>
              <Button
                onClick={handleTestStart}
                size='lg'
                className='flex items-center space-x-2'
              >
                <Play className='h-5 w-5' />
                <span>Start LITMUS Test</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Test Header */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center space-x-4'>
              <div className='text-sm text-muted-foreground'>
                Question {currentQuestion + 1} of {totalQuestions}
              </div>
              <div className='text-sm text-muted-foreground'>
                Progress:{' '}
                {Math.round(((currentQuestion + 1) / totalQuestions) * 100)}%
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <Clock className='h-4 w-4' />
              <span
                className={`font-mono ${timeRemaining < 300 ? 'text-red-600' : ''}`}
              >
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
          <Progress
            value={((currentQuestion + 1) / totalQuestions) * 100}
            className='h-2'
          />
        </CardContent>
      </Card>

      {/* Question */}
      {renderQuestion()}
    </div>
  );
};

export default LitmusTestStep;
