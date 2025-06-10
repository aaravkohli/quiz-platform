import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { QuizSubmission } from '../types/quiz';
import { quizService } from '../services/api';

const QuizAttempts: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [attempts, setAttempts] = useState<QuizSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    completedAttempts: 0,
    averageScore: 0,
    averageTimeSpent: 0
  });

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        setLoading(true);
        const data = await quizService.getQuizAttempts(Number(id));
        setAttempts(data);

        // Calculate statistics
        const completedAttempts = data.filter(attempt => attempt.completedAt);
        const totalTimeSpent = completedAttempts.reduce((total, attempt) => {
          const start = new Date(attempt.startedAt);
          const end = attempt.completedAt ? new Date(attempt.completedAt) : new Date();
          return total + (end.getTime() - start.getTime()) / (1000 * 60); // Convert to minutes
        }, 0);

        setStats({
          totalAttempts: data.length,
          completedAttempts: completedAttempts.length,
          averageScore: completedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / completedAttempts.length || 0,
          averageTimeSpent: totalTimeSpent / completedAttempts.length || 0
        });
      } catch (err) {
        setError('Failed to load quiz attempts');
        console.error('Error loading attempts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Quiz Attempts</h2>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-indigo-600">Total Attempts</h3>
          <p className="text-2xl font-bold text-indigo-900">{stats.totalAttempts}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">Completed Attempts</h3>
          <p className="text-2xl font-bold text-green-900">{stats.completedAttempts}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-600">Average Score</h3>
          <p className="text-2xl font-bold text-yellow-900">{stats.averageScore.toFixed(1)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-600">Avg. Time Spent</h3>
          <p className="text-2xl font-bold text-purple-900">{stats.averageTimeSpent.toFixed(1)} min</p>
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <p className="text-gray-500">No attempts have been made for this quiz yet.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attempts.map((attempt) => {
                const startTime = new Date(attempt.startedAt);
                const endTime = attempt.completedAt ? new Date(attempt.completedAt) : new Date();
                const timeSpent = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // Convert to minutes

                return (
                  <tr key={attempt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attempt.studentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attempt.score}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(startTime, 'MMM d, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attempt.completedAt
                        ? format(new Date(attempt.completedAt), 'MMM d, yyyy HH:mm:ss')
                        : 'Not completed'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {timeSpent.toFixed(1)} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        attempt.completedAt
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {attempt.completedAt ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default QuizAttempts;