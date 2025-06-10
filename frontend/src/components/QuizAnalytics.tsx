import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { quizService } from '../services/api';

interface QuizAnalyticsData {
    quizId: number;
    averageScore: number;
    totalAttempts: number;
    completionRate: number;
    averageTimeSpentMinutes: number;
    questionStats?: {
        questionId: number;
        correctAnswers: number;
        totalAttempts: number;
        averageTimeSpent: number;
    }[];
}

export const QuizAnalytics: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [analytics, setAnalytics] = useState<QuizAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await quizService.getQuizAnalytics(Number(id));
                setAnalytics(data);
            } catch (error) {
                setError('Error loading quiz analytics. Please try again.');
                console.error('Error loading quiz analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz Analytics</h2>
                <p className="text-gray-500">No analytics data available for this quiz.</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quiz Analytics</h2>
            
            {/* Overview Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-indigo-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-indigo-600">Average Score</h3>
                    <p className="text-3xl font-bold text-indigo-900">{analytics.averageScore.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-green-600">Total Attempts</h3>
                    <p className="text-3xl font-bold text-green-900">{analytics.totalAttempts}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-yellow-600">Completion Rate</h3>
                    <p className="text-3xl font-bold text-yellow-900">{(analytics.completionRate * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-600">Average Time Spent</h3>
                    <p className="text-3xl font-bold text-purple-900">{analytics.averageTimeSpentMinutes.toFixed(1)} min</p>
                </div>
            </div>

            {/* Question-wise Statistics */}
            {analytics.questionStats && analytics.questionStats.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Question-wise Performance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analytics.questionStats.map((stat, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Question {stat.questionId}</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Correct Answers:</span>
                                        <span className="font-medium text-gray-900">{stat.correctAnswers}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Total Attempts:</span>
                                        <span className="font-medium text-gray-900">{stat.totalAttempts}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Success Rate:</span>
                                        <span className="font-medium text-gray-900">
                                            {((stat.correctAnswers / stat.totalAttempts) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Avg. Time:</span>
                                        <span className="font-medium text-gray-900">{stat.averageTimeSpent.toFixed(1)}s</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}; 