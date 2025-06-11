import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { quizService } from '../services/api';
import { Quiz, Question, Answer, QuestionType } from '../types/quiz';

export const QuizForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [quiz, setQuiz] = useState<Quiz>({
        title: '',
        description: '',
        timeLimit: 30,
        questions: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadQuiz = useCallback(async () => {
        try {
            setLoading(true);
            const data = await quizService.getQuiz(parseInt(id!));
            // Ensure questions array is initialized and properly structured
            const quizData = {
                ...data,
                questions: Array.isArray(data.questions) ? data.questions.map(q => ({
                    ...q,
                    answers: Array.isArray(q.answers) ? q.answers : []
                })) : []
            };
            console.log('Loaded quiz data:', quizData);
            setQuiz(quizData);
        } catch (error) {
            setError('Error loading quiz. Please try again.');
            console.error('Error loading quiz:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            loadQuiz();
        }
    }, [id, loadQuiz]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);

            // Validate that quiz has at least one question
            if (!quiz.questions || quiz.questions.length === 0) {
                setError('Quiz must have at least one question.');
                setLoading(false);
                return;
            }

            // Create a new quiz object with all required data
            const quizData = {
                ...quiz,
                questions: quiz.questions.map((question, index) => ({
                    ...question,
                    quizId: id ? parseInt(id) : undefined,
                    order: index + 1,
                    answers: question.answers.map(answer => ({
                        ...answer,
                        answerText: answer.answerText.trim(),
                        isCorrect: Boolean(answer.isCorrect)
                    }))
                }))
            };

            // Remove any undefined or null values and ensure proper data structure
            const cleanQuizData = {
                ...JSON.parse(JSON.stringify(quizData)),
                questions: quizData.questions.map(q => ({
                    ...q,
                    answers: q.answers.map(a => ({
                        ...a,
                        isCorrect: Boolean(a.isCorrect)
                    }))
                }))
            };

            if (id) {
                await quizService.updateQuiz(parseInt(id), cleanQuizData);
            } else {
                await quizService.createQuiz(cleanQuizData);
            }

            navigate('/quizzes');
        } catch (error) {
            setError('Error saving quiz. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddQuestion = () => {
        console.log('Adding new question to quiz:', quiz);
        
        const newQuestion: Question = {
            questionText: '',
            type: QuestionType.MULTIPLE_CHOICE,
            points: 1,
            answers: [],
            quizId: id ? parseInt(id) : undefined,
            order: quiz.questions ? quiz.questions.length + 1 : 1
        };

        setQuiz(prev => {
            const questions = [...(prev.questions || [])];
            if (newQuestion.type === QuestionType.TRUE_FALSE) {
                newQuestion.answers = [
                    { answerText: 'True', isCorrect: true },
                    { answerText: 'False', isCorrect: false }
                ];
            } else if (newQuestion.type === QuestionType.MULTIPLE_CHOICE) {
                newQuestion.answers = [
                    { answerText: '', isCorrect: true },
                    { answerText: '', isCorrect: false }
                ];
            } else if (newQuestion.type === QuestionType.SHORT_ANSWER) {
                newQuestion.answers = [
                    { answerText: '', isCorrect: true }
                ];
            } else if (newQuestion.type === QuestionType.FILE_UPLOAD) {
                newQuestion.answers = [
                    { answerText: 'Upload your file here', isCorrect: true }
                ];
            }
            
            const updatedQuiz = {
                ...prev,
                questions: [...questions, newQuestion]
            };
            
            console.log('Updated quiz after adding question:', updatedQuiz);
            return updatedQuiz;
        });
    };

    const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
        setQuiz(prev => {
            const questions = [...(prev.questions || [])];
            questions[index] = {
                ...questions[index],
                [field]: field === 'points' ? (value === '' ? 1 : parseInt(value) || 1) : value
            };

            // If changing question type, update answers accordingly
            if (field === 'type') {
                if (value === QuestionType.TRUE_FALSE) {
                    questions[index].answers = [
                        { answerText: 'True', isCorrect: true },
                        { answerText: 'False', isCorrect: false }
                    ];
                } else if (value === QuestionType.MULTIPLE_CHOICE) {
                    questions[index].answers = [
                        { answerText: '', isCorrect: true },
                        { answerText: '', isCorrect: false }
                    ];
                } else if (value === QuestionType.SHORT_ANSWER) {
                    questions[index].answers = [
                        { answerText: '', isCorrect: true }
                    ];
                } else if (value === QuestionType.FILE_UPLOAD) {
                    questions[index].answers = [
                        { answerText: 'Upload your file here', isCorrect: true }
                    ];
                }
            }

            return { ...prev, questions };
        });
    };

    const handleAddAnswer = (questionIndex: number) => {
        const newAnswer: Answer = {
            answerText: '',
            isCorrect: false
        };

        setQuiz(prev => {
            const questions = [...(prev.questions || [])];
            questions[questionIndex] = {
                ...questions[questionIndex],
                answers: [...(questions[questionIndex].answers || []), newAnswer]
            };
            return { ...prev, questions };
        });
    };

    const handleAnswerChange = (questionIndex: number, answerIndex: number, field: keyof Answer, value: any) => {
        setQuiz(prev => {
            const questions = [...(prev.questions || [])];
            const answers = [...(questions[questionIndex].answers || [])];
            
            console.log('Before change - Question:', questions[questionIndex]);
            console.log('Before change - Answers:', answers);
            
            // If this is a multiple choice or true/false question and we're setting isCorrect
            if ((questions[questionIndex].type === QuestionType.MULTIPLE_CHOICE || 
                 questions[questionIndex].type === QuestionType.TRUE_FALSE) && 
                field === 'isCorrect') {
                // For radio buttons, we need to set all other answers to false
                answers.forEach((_, i) => {
                    answers[i] = { 
                        ...answers[i], 
                        isCorrect: i === answerIndex ? true : false 
                    };
                });
            } else {
                // For other fields (like answerText), just update the specific answer
            answers[answerIndex] = {
                ...answers[answerIndex],
                    [field]: field === 'answerText' ? value.trim() : value
            };
            }
            
            questions[questionIndex] = {
                ...questions[questionIndex],
                answers
            };

            console.log('After change - Question:', questions[questionIndex]);
            console.log('After change - Answers:', answers);
            
            return { ...prev, questions };
        });
    };

    const handleRemoveQuestion = (index: number) => {
        setQuiz(prev => ({
            ...prev,
            questions: prev.questions?.filter((_, i) => i !== index)
        }));
    };

    const handleRemoveAnswer = (questionIndex: number, answerIndex: number) => {
        setQuiz(prev => {
            const questions = [...(prev.questions || [])];
            questions[questionIndex] = {
                ...questions[questionIndex],
                answers: questions[questionIndex].answers?.filter((_, i) => i !== answerIndex)
            };
            return { ...prev, questions };
        });
    };

    const renderQuestionInputs = (question: Question, index: number) => {
        return (
            <div key={index} className="border-b border-gray-200 pb-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Question {index + 1}</h3>
                    <button
                        type="button"
                        onClick={() => handleRemoveQuestion(index)}
                        className="text-red-600 hover:text-red-800"
                    >
                        Remove
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Question Text</label>
                        <input
                            type="text"
                            value={question.questionText}
                            onChange={(e) => handleQuestionChange(index, 'questionText', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 bg-white hover:border-gray-400 transition-colors duration-200"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Question Type</label>
                        <select
                            value={question.type}
                            onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 bg-white hover:border-gray-400 transition-colors duration-200"
                        >
                            <option value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</option>
                            <option value={QuestionType.TRUE_FALSE}>True/False</option>
                            <option value={QuestionType.SHORT_ANSWER}>Short Answer</option>
                            <option value={QuestionType.FILE_UPLOAD}>File Upload</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Points</label>
                        <input
                            type="number"
                            value={question.points}
                            onChange={(e) => handleQuestionChange(index, 'points', parseInt(e.target.value))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 bg-white hover:border-gray-400 transition-colors duration-200"
                            min="1"
                            required
                        />
                    </div>

                    {(question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.TRUE_FALSE) && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Answers</label>
                                <button
                                    type="button"
                                    onClick={() => handleAddAnswer(index)}
                                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                    Add Answer
                                </button>
                            </div>
                            <div className="space-y-3">
                                {question.answers?.map((answer, answerIndex) => (
                                    <div key={answerIndex} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors duration-200">
                                        <input
                                            type="text"
                                            value={answer.answerText}
                                            onChange={(e) => handleAnswerChange(index, answerIndex, 'answerText', e.target.value)}
                                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 bg-white hover:border-gray-400 transition-colors duration-200"
                                            placeholder="Answer text"
                                            required
                                        />
                                        <label className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-md">
                                            <input
                                                type="radio"
                                                checked={answer.isCorrect}
                                                onChange={(e) => handleAnswerChange(index, answerIndex, 'isCorrect', e.target.checked)}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-600 font-medium">Correct</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAnswer(index, answerIndex)}
                                            className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors duration-200"
                                        >
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {question.type === QuestionType.SHORT_ANSWER && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Correct Answer</label>
                            <input
                                type="text"
                                value={question.answers?.[0]?.answerText || ''}
                                onChange={(e) => {
                                    if (!question.answers?.length) {
                                        handleAddAnswer(index);
                                    }
                                    handleAnswerChange(index, 0, 'answerText', e.target.value);
                                    handleAnswerChange(index, 0, 'isCorrect', true);
                                }}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 bg-white hover:border-gray-400 transition-colors duration-200"
                                placeholder="Enter the correct answer"
                                required
                            />
                        </div>
                    )}

                    {question.type === QuestionType.FILE_UPLOAD && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">File Upload Instructions</label>
                            <textarea
                                value={question.answers?.[0]?.answerText || ''}
                                onChange={(e) => {
                                    if (!question.answers?.length) {
                                        handleAddAnswer(index);
                                    }
                                    handleAnswerChange(index, 0, 'answerText', e.target.value);
                                    handleAnswerChange(index, 0, 'isCorrect', true);
                                }}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 bg-white hover:border-gray-400 transition-colors duration-200"
                                placeholder="Enter instructions for file upload"
                                rows={3}
                                required
                            />
                        </div>
                    )}
                </div>
            </div>
        );
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

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                        type="text"
                        value={quiz.title}
                        onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        value={quiz.description}
                        onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        rows={3}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Time Limit (minutes)</label>
                    <input
                        type="number"
                        value={quiz.timeLimit}
                        onChange={(e) => setQuiz({ ...quiz, timeLimit: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        min="1"
                        required
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-gray-900">Questions</h2>
                        <button
                            type="button"
                            onClick={handleAddQuestion}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Add Question
                        </button>
                    </div>

                    <div className="space-y-6">
                        {quiz.questions?.map((question, index) => renderQuestionInputs(question, index))}
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={() => navigate('/quizzes')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Quiz'}
                    </button>
                </div>
            </form>
        </div>
    );
}; 