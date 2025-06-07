import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quiz, Question } from '../types/quiz';
import { quizService } from '../services/api';

interface QuizFormProps {
    quizId?: number;
    onSave: () => void;
}

export const QuizForm: React.FC<QuizFormProps> = ({ quizId, onSave }) => {
    const [quiz, setQuiz] = useState<Quiz>({
        id: -1, // Temporary ID for new quizzes
        title: '',
        description: '',
        instructorId: 0,
        isPublished: false,
        questions: [],
    });

    const [newQuestion, setNewQuestion] = useState<Question>({
        questionText: '',
        type: 'MULTIPLE_CHOICE',
        points: 1,
        answers: [
            { answerText: '', isCorrect: true, order: 1 },
            { answerText: '', isCorrect: false, order: 2 },
            { answerText: '', isCorrect: false, order: 3 },
            { answerText: '', isCorrect: false, order: 4 }
        ]
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<Question[]>([]);

    const loadQuiz = async () => {
        if (!quizId) return;
        try {
            const loadedQuiz = await quizService.getQuiz(quizId);
            setQuiz(loadedQuiz);
            setQuestions(loadedQuiz.questions || []);
        } catch (error) {
            setError('Error loading quiz. Please try again.');
            console.error('Error loading quiz:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (quizId) {
            loadQuiz();
        }
    }, [quizId, loadQuiz]);

    const handleQuizChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setQuiz(prev => ({ ...prev, [name]: value }));
    };

    const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewQuestion(prev => ({
            ...prev,
            questionText: e.target.value
        }));
    };

    const handleOptionChange = (index: number, value: string) => {
        setNewQuestion(prev => ({
            ...prev,
            answers: prev.answers.map((answer, i) => 
                i === index ? { ...answer, answerText: value } : answer
            )
        }));
    };

    const handleCorrectAnswerChange = (index: number) => {
        setNewQuestion(prev => ({
            ...prev,
            answers: prev.answers.map((answer, i) => ({
                ...answer,
                isCorrect: i === index
            }))
        }));
    };

    const handleAddQuestion = () => {
        if (!newQuestion.questionText || newQuestion.answers.some(answer => !answer.answerText)) {
            setError('Please fill in all question fields.');
            return;
        }
        setQuestions(prev => [...prev, newQuestion]);
        setNewQuestion({
            questionText: '',
            type: 'MULTIPLE_CHOICE',
            points: 1,
            answers: [
                { answerText: '', isCorrect: true, order: 1 },
                { answerText: '', isCorrect: false, order: 2 },
                { answerText: '', isCorrect: false, order: 3 },
                { answerText: '', isCorrect: false, order: 4 }
            ]
        });
    };

    const handleRemoveQuestion = (index: number) => {
        setQuestions(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!quiz.title || !quiz.description) {
            setError('Please fill in all required fields.');
            return;
        }
        // Always include the last question if filled out
        const isNewQuestionFilled = newQuestion.questionText && newQuestion.answers.every(a => a.answerText);
        const questionsToSave = isNewQuestionFilled ? [...questions, newQuestion] : questions;
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);
            console.log('Saving quiz with questions:', questionsToSave);
            let savedQuiz: Quiz;
            if (quizId) {
                savedQuiz = await quizService.updateQuiz(quizId, { ...quiz, questions: [] });
            } else {
                savedQuiz = await quizService.createQuiz({ ...quiz, questions: [] });
            }
            for (const question of questionsToSave) {
                await quizService.addQuestion(savedQuiz.id, question);
            }
            setSuccess(quizId ? 'Quiz updated successfully!' : 'Quiz created successfully!');
            onSave();
            if (!quizId) {
                navigate(`/edit-quiz/${savedQuiz.id}`);
            }
        } catch (error) {
            setError('Error saving quiz. Please try again.');
            console.error('Error saving quiz:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        {quizId ? 'Edit Quiz' : 'Create New Quiz'}
                    </h2>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-6">
                            {success}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                id="title"
                                value={quiz.title}
                                onChange={handleQuizChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <textarea
                                name="description"
                                id="description"
                                value={quiz.description}
                                onChange={handleQuizChange}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700">
                                Time Limit (minutes)
                            </label>
                            <input
                                type="number"
                                name="timeLimit"
                                id="timeLimit"
                                value={quiz.timeLimit || ''}
                                onChange={handleQuizChange}
                                min="1"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Questions</h3>

                            {questions.map((question, index) => (
                                <div key={index} className="bg-white shadow rounded-lg p-6 mb-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            Question {index + 1} ({question.points} points)
                                        </h3>
                                        <button
                                            onClick={() => handleRemoveQuestion(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <p className="text-gray-700 mb-2">{question.questionText}</p>
                                    <div className="space-y-2">
                                        {question.answers.map((answer, optIndex) => (
                                            <div
                                                key={optIndex}
                                                className={`p-2 rounded ${
                                                    answer.isCorrect
                                                        ? 'bg-green-50 border border-green-200'
                                                        : 'bg-gray-50'
                                                }`}
                                            >
                                                {answer.answerText}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="bg-white shadow rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Question</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="questionText" className="block text-sm font-medium text-gray-700">
                                            Question Text
                                        </label>
                                        <textarea
                                            name="questionText"
                                            id="questionText"
                                            value={newQuestion.questionText}
                                            onChange={handleQuestionChange}
                                            rows={2}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Options
                                        </label>
                                        {newQuestion.answers.map((answer, index) => (
                                            <div key={index} className="flex items-center space-x-2 mb-2">
                                                <input
                                                    type="radio"
                                                    name="correctAnswer"
                                                    checked={answer.isCorrect}
                                                    onChange={() => handleCorrectAnswerChange(index)}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <input
                                                    type="text"
                                                    value={answer.answerText}
                                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                                    placeholder={`Option ${index + 1}`}
                                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <label htmlFor="points" className="block text-sm font-medium text-gray-700">
                                            Points
                                        </label>
                                        <input
                                            type="number"
                                            name="points"
                                            id="points"
                                            value={newQuestion.points}
                                            onChange={(e) => setNewQuestion(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                                            min="1"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddQuestion}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Add Question
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={loading}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Quiz'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}; 