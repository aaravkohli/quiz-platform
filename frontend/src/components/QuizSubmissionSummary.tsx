import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { quizService } from '../services/api';
import { QuizSubmission } from '../types/quiz';

export const QuizSubmissionSummary: React.FC = () => {
    const { id } = useParams();
    const [submission, setSubmission] = useState<QuizSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubmission = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await quizService.getSubmissionById(Number(id));
                setSubmission(result);
            } catch (err) {
                setError('Error loading submission.');
            } finally {
                setLoading(false);
            }
        };
        fetchSubmission();
    }, [id]);

    if (loading) {
        return <div className="text-center">Loading...</div>;
    }
    if (error) {
        return <div className="text-center text-red-600">{error}</div>;
    }
    if (!submission) {
        return <div className="text-center">Submission not found.</div>;
    }

    return (
        <div className="max-w-xl mx-auto mt-12 bg-white shadow rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Quiz Submitted!</h2>
            <div className="text-lg mb-2">Your Score: <span className="font-bold">{submission.score}</span></div>
            <Link to="/" className="mt-4 inline-block text-indigo-600 hover:underline">Back to Home</Link>
        </div>
    );
}; 