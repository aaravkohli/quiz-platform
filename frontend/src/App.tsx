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
import { QuizAnalytics } from './components/QuizAnalytics';
import { QuizReport } from './components/QuizReport';
import Footer from './components/Footer';
import './styles/custom.css';

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
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-light">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-color"></div>
            </div>
        );
    }

    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="min-h-screen flex flex-col bg-neutral-light">
                <nav className="bg-white shadow-sm animate-fade-in">
                    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                    <Link
                                        to="/"
                                    className="flex-shrink-0 flex items-center hover-scale"
                                    >
                                    <h1 className="text-2xl font-bold text-primary-color">Quiz Platform</h1>
                                        </Link>
                            </div>
                            <div className="flex items-center space-x-6">
                                {user ? (
                                    <>
                                        <Link
                                            to="/profile"
                                            className="text-text-secondary hover:text-text-primary transition-colors duration-200 text-sm font-medium"
                                        >
                                            Profile
                                        </Link>
                                        <button
                                            onClick={() => {
                                                authService.logout();
                                                setUser(null);
                                            }}
                                            className="text-text-secondary hover:text-text-primary transition-colors duration-200 text-sm font-medium"
                                        >
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        to="/login"
                                        className="text-text-secondary hover:text-text-primary transition-colors duration-200 text-sm font-medium"
                                    >
                                        Login
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                <main className="flex-grow max-w-[1920px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {user && (
                            <aside className="hidden lg:block lg:col-span-3">
                                <div className="sticky top-8 bg-white rounded-lg shadow-sm p-6">
                                    <nav className="space-y-4">
                                        <Link
                                            to="/"
                                            className="block text-text-secondary hover:text-text-primary transition-colors duration-200"
                                        >
                                            Dashboard
                                        </Link>
                                        {user.role === 'INSTRUCTOR' && (
                                            <>
                                                <Link
                                                    to="/create-quiz"
                                                    className="block text-text-secondary hover:text-text-primary transition-colors duration-200"
                                                >
                                                    Create Quiz
                                                </Link>
                                                <Link
                                                    to="/my-quizzes"
                                                    className="block text-text-secondary hover:text-text-primary transition-colors duration-200"
                                                >
                                                    My Quizzes
                                                </Link>
                                            </>
                                        )}
                                        <Link
                                            to="/profile"
                                            className="block text-text-secondary hover:text-text-primary transition-colors duration-200"
                                        >
                                            Profile Settings
                                        </Link>
                                    </nav>
                                </div>
                            </aside>
                        )}
                        <div className={`${user ? 'lg:col-span-9' : 'lg:col-span-12'}`}>
                    <Routes>
                        <Route
                            path="/"
                            element={
                                user ? (
                                    <QuizList user={user} />
                                ) : (
                                            <div className="text-center animate-slide-up max-w-3xl mx-auto">
                                                <h2 className="text-3xl font-bold mb-6 text-text-primary">Welcome to Quiz Platform</h2>
                                                <p className="text-lg text-text-secondary mb-8">
                                                    Please <Link to="/login" className="text-primary-color hover:text-secondary-color transition-colors duration-200">login</Link> to access quizzes.
                                        </p>
                                    </div>
                                )
                            }
                        />
                        <Route
                            path="/quizzes"
                            element={<Navigate to="/" replace />}
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
                                    <QuizForm />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/edit-quiz/:id"
                            element={
                                <ProtectedRoute requireInstructor>
                                    <QuizForm />
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
                        <Route
                            path="/quiz-analytics/:id"
                            element={
                                <ProtectedRoute>
                                    <QuizAnalytics />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/quiz-report/:id"
                            element={
                                <ProtectedRoute>
                                    <QuizReport />
                                </ProtectedRoute>
                            }
                        />
                                <Route
                                    path="/my-quizzes"
                                    element={
                                        <ProtectedRoute requireInstructor>
                                            {user && <QuizList user={user} showOnlyMyQuizzes={true} />}
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </Router>
    );
};

export default App; 