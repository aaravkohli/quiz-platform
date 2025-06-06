import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quiz, Question, QuizSubmission } from '../types/quiz';
import { quizService } from '../services/api';

interface QuizTakerProps {
    quizId: number;
    onComplete: () => void;
}

export const QuizTaker: React.FC<QuizTakerProps> = ({ quizId, onComplete }) => {
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [submission, setSubmission] = useState<QuizSubmission | null>(null);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadQuiz();
    }, [quizId]);

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;

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
    }, [timeLeft]);

    const loadQuiz = async () => {
        try {
            setLoading(true);
            setError(null);
            const loadedQuiz = await quizService.getQuiz(quizId);
            console.log('Loaded quiz:', loadedQuiz);
            setQuiz(loadedQuiz);

            // Start the quiz
            const startedQuiz = await quizService.startQuiz(quizId);
            console.log('Started quiz submission:', startedQuiz);
            setSubmission(startedQuiz);
            setAnswers(startedQuiz.answers || {});

            // Set timer if quiz has time limit and startedAt is valid
            if (loadedQuiz.timeLimit && startedQuiz.startedAt) {
                const endTime = new Date(startedQuiz.startedAt);
                if (!isNaN(endTime.getTime())) {
                    endTime.setMinutes(endTime.getMinutes() + Number(loadedQuiz.timeLimit));
                    const timeLeft = Math.max(0, Math.floor((endTime.getTime() - Date.now()) / 1000));
                    setTimeLeft(timeLeft);
                } else {
                    setTimeLeft(null);
                }
            } else {
                setTimeLeft(null);
            }
        } catch (error) {
            console.error('Error loading quiz:', error);
            setError('Error loading quiz. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId: number, answerId: number) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answerId,
        }));
    };

    const handleSubmit = async () => {
        if (!submission) return;

        try {
            setLoading(true);
            const result = await quizService.submitQuiz(quizId, answers);
            setSubmission(result);
            onComplete();
            navigate(`/quiz-submission/${result.id}`);
        } catch (error) {
            setError('Error submitting quiz. Please try again.');
            console.error('Error submitting quiz:', error);
        } finally {
            setLoading(false);
        }
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
        console.log('Quiz or submission is null:', { quiz, submission });
        return (
            <div className="max-w-3xl mx-auto mt-8">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 px-4 py-3 rounded">
                    Quiz not found or not available.
                </div>
            </div>
        );
    }

    console.log('Rendering quiz with questions:', quiz.questions);

    const progress = (Object.keys(answers).length / (quiz.questions?.length || 1)) * 100;

    return (
        <div className="max-w-3xl mx-auto mt-8">
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">{quiz.title}</h2>
                        {typeof timeLeft === 'number' && !isNaN(timeLeft) && (
                            <div className="text-lg font-medium text-gray-900">
                                Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </div>
                        )}
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="space-y-8">
                        {quiz.questions?.map((question, index) => (
                            <div key={question.id} className="border-b border-gray-200 pb-6 last:border-0">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Question {index + 1} ({question.points} points)
                                </h3>
                                <p className="text-gray-700 mb-4">{question.questionText}</p>
                                <div className="space-y-2">
                                    {question.answers?.map((answer, optIndex) => (
                                        typeof answer.id === 'number' ? (
                                            <label
                                                key={answer.id}
                                                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                                            >
                                                <input
                                                    type="radio"
                                                    name={`question-${question.id}`}
                                                    checked={answers[question.id!] === answer.id}
                                                    onChange={() => handleAnswerChange(question.id!, answer.id as number)}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-gray-700">{answer.answerText}</span>
                                            </label>
                                        ) : null
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Quiz'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}; 