import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Quiz } from '../types/quiz';
import { quizService } from '../services/api';
import { User } from '../types/quiz';
import { useAuth } from '../contexts/AuthContext';

interface QuizListProps {
    user: User;
    showOnlyMyQuizzes?: boolean;
}

export const QuizList: React.FC<QuizListProps> = ({ user, showOnlyMyQuizzes = false }) => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
    const [showForceDelete, setShowForceDelete] = useState(false);
    const [forceDeleteQuiz, setForceDeleteQuiz] = useState<Quiz | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadQuizzes();
    }, []);

    const loadQuizzes = async () => {
        try {
            setLoading(true);
            setError(null);
            const loadedQuizzes = await quizService.getQuizzes();
            setQuizzes(loadedQuizzes);
        } catch (error) {
            setError('Error loading quizzes. Please try again.');
            console.error('Error loading quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuiz = async (quizId: number) => {
        try {
            const result = await quizService.deleteQuiz(quizId);
            if (result && result.hasSubmissions) {
                setShowForceDelete(true);
                setForceDeleteQuiz(quizToDelete);
                return;
            }
            // If we get here, the delete was successful
            setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
            setQuizToDelete(null);
            setShowForceDelete(false);
            setForceDeleteQuiz(null);
        } catch (error: any) {
            if (error.status === 409 && error.data?.hasSubmissions) {
                setShowForceDelete(true);
                setForceDeleteQuiz(quizToDelete);
                return;
            }
            console.error('Error deleting quiz:', error);
            setError('Error deleting quiz. Please try again.');
            setQuizToDelete(null);
            setShowForceDelete(false);
            setForceDeleteQuiz(null);
        }
    };

    const handleForceDeleteQuiz = async (quizId: number) => {
        try {
            await quizService.deleteQuizForce(quizId);
            setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
            setShowForceDelete(false);
            setForceDeleteQuiz(null);
            setQuizToDelete(null);
        } catch (error) {
            console.error('Error force deleting quiz:', error);
            setError('Error force deleting quiz. Please try again.');
            setShowForceDelete(false);
            setForceDeleteQuiz(null);
            setQuizToDelete(null);
        }
    };

    const handlePublishQuiz = async (quizId: number) => {
        try {
            setError(null);
            
            // First get the quiz to check if it has questions
            const quiz = await quizService.getQuiz(quizId);
            
            if (!quiz.questions || quiz.questions.length === 0) {
                setError('Cannot publish quiz: Quiz must have at least one question.');
                return;
            }

            // Check if each multiple choice question has exactly one correct answer
            const invalidQuestions = quiz.questions.filter(question => {
                if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
                    const correctAnswers = question.answers?.filter(answer => answer.isCorrect) || [];
                    return correctAnswers.length !== 1;
                }
                return false;
            });

            if (invalidQuestions.length > 0) {
                setError('Cannot publish quiz: Multiple choice and true/false questions must have exactly one correct answer.');
                return;
            }

            const updatedQuiz = await quizService.publishQuiz(quizId);
            
            // Update the quizzes list with the published quiz
            setQuizzes(quizzes.map(q => q.id === quizId ? updatedQuiz : q));
        } catch (error: any) {
            // Handle specific error messages from the API
            if (error.response?.status === 400 && error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError('Error publishing quiz. Please try again.');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading quizzes...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-3xl mx-auto mt-8">
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative">
                    <div className="flex items-center">
                        <svg className="h-5 w-5 text-red-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="absolute top-3 right-3 text-red-400 hover:text-red-500"
                    >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    const filteredQuizzes = user.role === 'INSTRUCTOR'
        ? (showOnlyMyQuizzes 
        ? quizzes.filter(quiz => quiz.instructorId === user.id)
            : quizzes)
        : quizzes.filter(quiz => quiz.isPublished === true);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    {user.role === 'INSTRUCTOR' 
                        ? (showOnlyMyQuizzes ? 'My Quizzes' : 'All Quizzes')
                        : 'Available Quizzes'}
                </h1>
                {user.role === 'INSTRUCTOR' && (
                    <Link
                        to="/create-quiz"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Create New Quiz
                    </Link>
                )}
            </div>

            {filteredQuizzes.length === 0 ? (
                <div className="text-center text-gray-500">
                    {user.role === 'INSTRUCTOR'
                        ? 'You haven\'t created any quizzes yet.'
                        : 'No quizzes available at the moment.'}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredQuizzes.map(quiz => (
                        <div key={quiz.id} className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">{quiz.title}</h3>
                                <p className="text-gray-500 mb-4">{quiz.description}</p>
                                
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {quiz.timeLimit} minutes
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        quiz.isPublished 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {quiz.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {user.role === 'INSTRUCTOR' ? (
                                        <>
                                            <Link
                                                to={`/edit-quiz/${quiz.id}`}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => setQuizToDelete(quiz)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                Delete
                                            </button>
                                            {!quiz.isPublished && (
                                                <button
                                                    onClick={() => handlePublishQuiz(quiz.id!)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                >
                                                    Publish
                                                </button>
                                            )}
                                            <Link
                                                to={`/quiz-attempts/${quiz.id}`}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                            >
                                                View Attempts
                                            </Link>
                                            <Link
                                                to={`/quiz-analytics/${quiz.id}`}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                Analytics
                                            </Link>
                                            <Link
                                                to={`/quiz-report/${quiz.id}`}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                            >
                                                Report
                                            </Link>
                                        </>
                                    ) : (
                                        <Link
                                            to={`/take-quiz/${quiz.id}`}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Take Quiz
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {quizToDelete && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                    <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-4">Delete Quiz</h3>
                        <p className="mb-6">Are you sure you want to delete the quiz <span className="font-semibold">{quizToDelete.title}</span>?</p>
                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                                onClick={() => setQuizToDelete(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                                onClick={async () => {
                                    if (quizToDelete?.id) {
                                        await handleDeleteQuiz(quizToDelete.id);
                                        setQuizToDelete(null);
                                    }
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showForceDelete && forceDeleteQuiz && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                    <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-4 text-red-700">Quiz Has Submissions</h3>
                        <p className="mb-6 text-gray-700">This quiz has student submissions. Deleting it will <span className="font-semibold text-red-700">permanently remove all submissions, questions, and answers</span> for <span className="font-semibold">{forceDeleteQuiz.title}</span>.<br/>Are you sure you want to continue?</p>
                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                                onClick={() => { setShowForceDelete(false); setForceDeleteQuiz(null); }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                                onClick={async () => {
                                    if (forceDeleteQuiz?.id) {
                                        await handleForceDeleteQuiz(forceDeleteQuiz.id);
                                        setQuizToDelete(null);
                                    }
                                }}
                            >
                                Delete Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};