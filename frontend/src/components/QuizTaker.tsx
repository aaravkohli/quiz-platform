import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizService } from '../services/api';
import { Quiz, QuizSubmission, Question } from '../types/quiz';

interface QuizTakerProps {
    quizId: number;
    onComplete?: () => void;
}

export const QuizTaker: React.FC<QuizTakerProps> = ({ quizId, onComplete }) => {
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [submission, setSubmission] = useState<QuizSubmission | null>(null);
    const [answers, setAnswers] = useState<Record<number, number | string>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);

    const loadQuiz = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Load the quiz
            const loadedQuiz = await quizService.getQuiz(quizId);
            setQuiz(loadedQuiz);

            // Start the quiz and create a submission
            const startedQuiz = await quizService.startQuiz(quizId);
            setSubmission(startedQuiz);
            setAnswers(startedQuiz.answers || {});

            // Set timer if quiz has time limit
            if (loadedQuiz.timeLimit) {
                setTimeLeft(loadedQuiz.timeLimit * 60);
            }
        } catch (error) {
            setError('Error loading quiz. Please try again.');
            console.error('Error loading quiz:', error);
        } finally {
            setLoading(false);
        }
    }, [quizId]);

    const handleSubmit = useCallback(async () => {
        try {
            const result = await quizService.submitQuiz(quizId, answers);
            setSubmission(result);
            if (onComplete) {
                onComplete();
            }
            navigate(`/quiz-submission/${result.id}`);
        } catch (error) {
            setError('Error submitting quiz. Please try again.');
            console.error('Error submitting quiz:', error);
        }
    }, [quizId, answers, onComplete, navigate]);

    useEffect(() => {
        loadQuiz();
    }, [loadQuiz]);

    useEffect(() => {
        if (submission && timeLeft !== null) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev === null || prev <= 0) {
                        clearInterval(timer);
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [submission, timeLeft, handleSubmit]);

    const handleAnswerChange = (questionId: number, value: number | string) => {
        const question = quiz?.questions?.find(q => q.id === questionId);
        if (!question) return;

        let formattedValue: number | string;
        
        switch (question.type) {
            case 'MULTIPLE_CHOICE':
            case 'TRUE_FALSE':
                // Ensure these are always numbers
                formattedValue = typeof value === 'string' ? parseInt(value, 10) : value;
                if (isNaN(formattedValue as number)) return;
                break;
            case 'SHORT_ANSWER':
                // For short answers, store the actual text
                formattedValue = String(value).trim();
                break;
            default:
                formattedValue = value;
        }

        setAnswers(prev => ({
            ...prev,
            [questionId]: formattedValue,
        }));
    };

    const handleFileUpload = async (questionId: number, file: File) => {
        try {
            // TODO: Implement file upload logic
            // For now, we'll just store the file name
            setAnswers(prev => ({
                ...prev,
                [questionId]: file.name,
            }));
        } catch (error) {
            setError('Error uploading file. Please try again.');
            console.error('Error uploading file:', error);
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading quiz...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-3xl mx-auto mt-8">
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                    {error}
                </div>
            </div>
        );
    }

    if (!quiz || !submission) {
        return (
            <div className="max-w-3xl mx-auto mt-8">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 px-4 py-3 rounded">
                    Quiz not found or not available.
                </div>
            </div>
        );
    }

    const question = quiz.questions?.[currentQuestion];
    if (!question) {
        return null;
    }

    const renderQuestion = () => {
        switch (question.type) {
            case 'MULTIPLE_CHOICE':
                return (
                    <div className="space-y-2">
                        {question.answers?.map((answer) => (
                            <label
                                key={answer.id}
                                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                            >
                                <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    checked={answers[question.id!] === answer.id}
                                    onChange={() => handleAnswerChange(question.id!, answer.id!)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-gray-700">{answer.answerText}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'TRUE_FALSE':
                return (
                    <div className="space-y-2">
                        {question.answers?.map((answer) => (
                            <label
                                key={answer.id}
                                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                            >
                                <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    checked={answers[question.id!] === answer.id}
                                    onChange={() => handleAnswerChange(question.id!, answer.id!)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-gray-700">{answer.answerText}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'SHORT_ANSWER':
                return (
                    <div className="mt-2">
                        <input
                            type="text"
                            value={answers[question.id!] as string || ''}
                            onChange={(e) => handleAnswerChange(question.id!, e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Enter your answer"
                        />
                    </div>
                );

            case 'FILE_UPLOAD':
                return (
                    <div className="mt-2">
                        <input
                            type="file"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    handleFileUpload(question.id!, file);
                                }
                            }}
                            className="mt-1 block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100"
                        />
                        {answers[question.id!] && (
                            <p className="mt-2 text-sm text-gray-500">
                                Selected file: {answers[question.id!]}
                            </p>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                    {/* Quiz Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">{quiz.title}</h2>
                        {timeLeft !== null && (
                            <div className="text-lg font-medium text-gray-900">
                                Time Left: {formatTime(timeLeft)}
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-indigo-600 h-2.5 rounded-full"
                                style={{ width: `${((currentQuestion + 1) / (quiz.questions?.length || 1)) * 100}%` }}
                            ></div>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            Question {currentQuestion + 1} of {quiz.questions?.length}
                        </p>
                    </div>

                    {/* Question */}
                    <div className="mb-8">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {question.questionText}
                            <span className="ml-2 text-sm text-gray-500">
                                ({question.points} points)
                            </span>
                        </h3>
                        {renderQuestion()}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between">
                        <button
                            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestion === 0}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        {currentQuestion === (quiz.questions?.length || 0) - 1 ? (
                            <button
                                onClick={handleSubmit}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Submit Quiz
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestion(prev => Math.min((quiz.questions?.length || 0) - 1, prev + 1))}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}; 