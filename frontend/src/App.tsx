import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, Navigate } from 'react-router-dom';
import { QuizForm } from './components/QuizForm';
import { QuizTaker } from './components/QuizTaker';
import { Login } from './components/Login';
import { QuizList } from './components/QuizList';
import { UserProfile } from './components/UserProfile';
import { authService } from './services/api';
import { User } from './types/quiz';
import { QuizSubmissionSummary } from './components/QuizSubmissionSummary';
import QuizAttempts from './components/QuizAttempts';

const QuizTakerWrapper = () => {
    const { id } = useParams();
    return <QuizTaker quizId={Number(id)} onComplete={() => {}} />;
};

const ProtectedRoute = ({ children, requireInstructor = false }: { children: React.ReactNode, requireInstructor?: boolean }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (requireInstructor && user.role !== 'INSTRUCTOR') {
        return <Navigate to="/" />;
    }

    return <>{children}</>;
};

const App = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const handleLogin = async () => {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
    };

    const handleProfileUpdate = (updatedUser: User) => {
        setUser(updatedUser);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="min-h-screen bg-gray-100">
                <nav className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex">
                                <div className="flex-shrink-0 flex items-center">
                                    <h1 className="text-xl font-bold text-indigo-600">Quiz Platform</h1>
                                </div>
                                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                    <Link
                                        to="/"
                                        className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                    >
                                        Home
                                    </Link>
                                    {user?.role === 'INSTRUCTOR' && (
                                        <Link
                                            to="/create-quiz"
                                            className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                                        >
                                            Create Quiz
                                        </Link>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                {user ? (
                                    <>
                                        <Link
                                            to="/profile"
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            Profile
                                        </Link>
                                        <button
                                            onClick={() => {
                                                authService.logout();
                                                setUser(null);
                                            }}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        to="/login"
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        Login
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <Routes>
                        <Route
                            path="/"
                            element={
                                user ? (
                                    <QuizList user={user} />
                                ) : (
                                    <div className="text-center">
                                        <h2 className="text-2xl font-bold mb-4">Welcome to Quiz Platform</h2>
                                        <p className="text-gray-600">
                                            Please <Link to="/login" className="text-indigo-600 hover:text-indigo-500">login</Link> to access quizzes.
                                        </p>
                                    </div>
                                )
                            }
                        />
                        <Route
                            path="/login"
                            element={
                                user ? (
                                    <Navigate to="/" />
                                ) : (
                                    <Login onLogin={handleLogin} />
                                )
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                user ? (
                                    <UserProfile user={user} onUpdate={handleProfileUpdate} />
                                ) : (
                                    <Navigate to="/login" />
                                )
                            }
                        />
                        <Route
                            path="/create-quiz"
                            element={
                                <ProtectedRoute requireInstructor>
                                    <QuizForm onSave={() => {}} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/edit-quiz/:id"
                            element={
                                <ProtectedRoute requireInstructor>
                                    <QuizForm onSave={() => {}} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/take-quiz/:id"
                            element={
                                <ProtectedRoute>
                                    <QuizTakerWrapper />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/quiz-submission/:id"
                            element={
                                <ProtectedRoute>
                                    <QuizSubmissionSummary />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/quiz-attempts/:id"
                            element={
                                <ProtectedRoute requireInstructor>
                                    <QuizAttempts />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default App; 