import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { quizService } from '../services/api';

interface QuizAnalyticsData {
    quizId: number;
    averageScore: number;
    totalAttempts: number;
    completionRate: number;
    averageTimeSpentMinutes: number;
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
        return <div className="text-center">Loading analytics...</div>;
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
            </div>
        );
    }

    if (!analytics) {
        return <div className="text-center">No analytics data available.</div>;
    }

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz Analytics</h2>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                    <h3 className="text-lg font-medium text-gray-900">Average Score</h3>
                    <p className="text-3xl font-bold text-indigo-600">{analytics.averageScore.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                    <h3 className="text-lg font-medium text-gray-900">Total Attempts</h3>
                    <p className="text-3xl font-bold text-indigo-600">{analytics.totalAttempts}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                    <h3 className="text-lg font-medium text-gray-900">Completion Rate</h3>
                    <p className="text-3xl font-bold text-indigo-600">{(analytics.completionRate * 100).toFixed(2)}%</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                    <h3 className="text-lg font-medium text-gray-900">Average Time Spent</h3>
                    <p className="text-3xl font-bold text-indigo-600">{analytics.averageTimeSpentMinutes.toFixed(2)} minutes</p>
                </div>
            </div>
        </div>
    );
}; 