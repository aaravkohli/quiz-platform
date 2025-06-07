import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { quizService } from '../services/api';

interface QuizReportData {
    studentId: number;
    score: number;
    completedAt: string | null;
    submissionId: number;
    answers: Record<string, string>;
}

export const QuizReport: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [report, setReport] = useState<QuizReportData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await quizService.getQuizReport(Number(id));
                console.log('Report data:', data);
                setReport(data);
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
        return <div className="text-center">Loading report...</div>;
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
            </div>
        );
    }

    if (!report || report.length === 0) {
        return <div className="text-center">No report data available.</div>;
    }

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz Report</h2>
            {report.map((submission, index) => (
                <div key={index} className="mb-6 border-b pb-4">
                    <h3 className="text-lg font-medium text-gray-900">Student: {submission.studentId}</h3>
                    <p className="text-sm text-gray-500">Submitted at: {submission.completedAt ? new Date(submission.completedAt).toLocaleString() : 'Not completed'}</p>
                    <p className="text-sm text-gray-500">Total Score: {submission.score}</p>
                    <div className="mt-2">
                        <h4 className="text-md font-medium text-gray-900">Answers:</h4>
                        {submission.answers && Object.entries(submission.answers).map(([questionId, answer], idx) => (
                            <div key={idx} className="mt-1">
                                <p className="text-sm text-gray-700"><strong>Question ID:</strong> {questionId}</p>
                                <p className="text-sm text-gray-700"><strong>Answer:</strong> {answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}; 