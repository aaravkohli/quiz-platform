import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { quizService } from '../services/api';
import { format } from 'date-fns';

interface QuizReportData {
    studentId: number;
    score: number;
    completedAt: string | null;
    submissionId: number;
    answers: Record<string, string>;
    studentName?: string;
    totalQuestions?: number;
    maxScore?: number;
}

export const QuizReport: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [report, setReport] = useState<QuizReportData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState({
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        totalSubmissions: 0
    });

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await quizService.getQuizReport(Number(id));
                console.log('Report data:', data);
                setReport(data);

                // Calculate statistics
                if (data.length > 0) {
                    const scores = data.map((sub: QuizReportData) => sub.score);
                    setStats({
                        averageScore: scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
                        highestScore: Math.max(...scores),
                        lowestScore: Math.min(...scores),
                        totalSubmissions: data.length
                    });
                }
            } catch (error) {
                setError('Error loading quiz report. Please try again.');
                console.error('Error loading quiz report:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
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

    if (!report || report.length === 0) {
        return (
            <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz Report</h2>
                <p className="text-gray-500">No submissions have been made for this quiz yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quiz Report</h2>
            
            {/* Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-indigo-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-indigo-600">Average Score</h3>
                    <p className="text-2xl font-bold text-indigo-900">{stats.averageScore.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-green-600">Highest Score</h3>
                    <p className="text-2xl font-bold text-green-900">{stats.highestScore}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-yellow-600">Lowest Score</h3>
                    <p className="text-2xl font-bold text-yellow-900">{stats.lowestScore}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-600">Total Submissions</h3>
                    <p className="text-2xl font-bold text-purple-900">{stats.totalSubmissions}</p>
                </div>
            </div>

            {/* Detailed Submissions */}
            <div className="space-y-6">
                {report.map((submission, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    Student {submission.studentId}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Submitted: {submission.completedAt ? format(new Date(submission.completedAt), 'PPpp') : 'Not completed'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-indigo-600">
                                    Score: {submission.score}
                                    {submission.maxScore && ` / ${submission.maxScore}`}
                                </p>
                                {submission.maxScore && (
                                    <p className="text-sm text-gray-500">
                                        {((submission.score / submission.maxScore) * 100).toFixed(1)}%
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        <div className="mt-4">
                            <h4 className="text-md font-medium text-gray-900 mb-2">Answers:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {submission.answers && Object.entries(submission.answers).map(([questionId, answer], idx) => (
                                    <div key={idx} className="bg-gray-50 p-3 rounded">
                                        <p className="text-sm font-medium text-gray-700">Question {questionId}</p>
                                        <p className="text-sm text-gray-600 mt-1">{answer}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}; 