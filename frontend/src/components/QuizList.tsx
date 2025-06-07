import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Quiz } from '../types/quiz';
import { quizService } from '../services/api';
import { User } from '../types/quiz';

interface QuizListProps {
    user: User;
}

export const QuizList: React.FC<QuizListProps> = ({ user }) => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
    const [showForceDelete, setShowForceDelete] = useState(false);
    const [forceDeleteQuiz, setForceDeleteQuiz] = useState<Quiz | null>(null);

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
            setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
        } catch (error) {
            setError('Error deleting quiz. Please try again.');
            console.error('Error deleting quiz:', error);
        }
    };

    const handleForceDeleteQuiz = async (quizId: number) => {
        try {
            await quizService.deleteQuizForce(quizId);
            setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
            setShowForceDelete(false);
            setForceDeleteQuiz(null);
        } catch (error) {
            setError('Error force deleting quiz. Please try again.');
            console.error('Error force deleting quiz:', error);
        }
    };

    const handlePublishQuiz = async (quizId: number) => {
        try {
            await quizService.publishQuiz(quizId);
            setQuizzes(quizzes.map(quiz => 
                quiz.id === quizId ? { ...quiz, isPublished: true } : quiz
            ));
        } catch (error) {
            setError('Error publishing quiz. Please try again.');
            console.error('Error publishing quiz:', error);
        }
    };

    if (loading) {
        return <div className="text-center">Loading quizzes...</div>;
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
            </div>
        );
    }

    const filteredQuizzes = user.role === 'INSTRUCTOR'
        ? quizzes.filter(quiz => quiz.instructorId === user.id)
        : quizzes.filter(quiz => quiz.isPublished === true);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                    {user.role === 'INSTRUCTOR' ? 'My Quizzes' : 'Available Quizzes'}
                </h2>
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
                        <div key={quiz.id} className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900">{quiz.title}</h3>
                                <p className="mt-2 text-sm text-gray-500">{quiz.description}</p>
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-sm text-gray-500">
                                        {quiz.questions?.length || 0} questions
                                        {quiz.timeLimit && ` • ${quiz.timeLimit} minutes`}
                                    </div>
                                    <div className="flex space-x-2">
                                        {user.role === 'INSTRUCTOR' ? (
                                            <>
                                                <Link
                                                    to={`/edit-quiz/${quiz.id}`}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => setQuizToDelete(quiz)}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                >
                                                    Delete
                                                </button>
                                                {!quiz.isPublished && (
                                                    <button
                                                        onClick={() => handlePublishQuiz(quiz.id)}
                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                    >
                                                        Publish
                                                    </button>
                                                )}
                                                {quiz.isPublished && (
                                                    <>
                                                        <Link
                                                            to={`/quiz-attempts/${quiz.id}`}
                                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        >
                                                            View Attempts
                                                        </Link>
                                                        <Link
                                                            to={`/quiz-analytics/${quiz.id}`}
                                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                        >
                                                            Analytics
                                                        </Link>
                                                        <Link
                                                            to={`/quiz-report/${quiz.id}`}
                                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                                        >
                                                            Report
                                                        </Link>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <Link
                                                to={`/take-quiz/${quiz.id}`}
                                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                Take Quiz
                                            </Link>
                                        )}
                                    </div>
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
                                    await handleDeleteQuiz(quizToDelete.id);
                                    setQuizToDelete(null);
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
                                    await handleForceDeleteQuiz(forceDeleteQuiz.id);
                                    setQuizToDelete(null);
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