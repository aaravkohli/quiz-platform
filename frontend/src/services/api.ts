import { Quiz, Question, QuizSubmission, User } from '../types/quiz';
import axios from 'axios';

interface AuthResponse {
    token: string;
    user: User;
}

const baseURL = process.env.REACT_APP_API_URL || 'https://quiz-platform-backend-44ba.onrender.com';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const handleResponse = async (response: Response) => {
    // Check if response is empty
    const text = await response.text();
    if (!text) {
        if (!response.ok) {
            throw {
                status: response.status,
                data: { message: 'Empty response from server' }
            };
        }
        return null;
    }
    
    // Parse the response text as JSON
    const data = JSON.parse(text);
    
    if (!response.ok) {
        throw {
            status: response.status,
            data: data
        };
    }
    return data;
};

const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const authService = {
    login: async (email: string, password: string): Promise<User> => {
        const response = await api.post<AuthResponse>('/api/users/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data.user;
    },

    register: async (email: string, password: string, firstName: string, lastName: string, role: 'STUDENT' | 'INSTRUCTOR'): Promise<User> => {
        const response = await api.post<AuthResponse>('/api/users/register', { email, password, firstName, lastName, role });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data.user;
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await api.get<User>('/api/users/me');
        return response.data;
    },

    updateProfile: async (user: User): Promise<User> => {
        const response = await api.put<User>('/api/users/me', user);
        return response.data;
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        await api.put('/api/users/me/password', { currentPassword, newPassword });
    },

    logout: () => {
        localStorage.removeItem('token');
    },
};

export const quizService = {
    // Quiz Management
    createQuiz: async (quiz: Quiz): Promise<Quiz> => {
        const response = await api.post<Quiz>('/api/quizzes', quiz);
        return response.data;
    },

    getQuizzes: async (): Promise<Quiz[]> => {
        const response = await api.get<Quiz[]>('/api/quizzes');
        return response.data;
    },

    getQuiz: async (id: number): Promise<Quiz> => {
        const response = await api.get<Quiz>(`/api/quizzes/${id}`);
        return response.data;
    },

    getQuizAttempts: async (id: number): Promise<QuizSubmission[]> => {
        const response = await api.get<QuizSubmission[]>(`/api/quizzes/${id}/attempts`);
        return response.data;
    },

    updateQuiz: async (id: number, quiz: Quiz): Promise<Quiz> => {
        const response = await api.put<Quiz>(`/api/quizzes/${id}`, quiz);
        return response.data;
    },

    deleteQuiz: async (id: number): Promise<any> => {
        try {
            const response = await api.delete(`/api/quizzes/${id}`);
            return response.data || { success: true };
        } catch (error: any) {
            if (error.response?.status === 409) {
                return { hasSubmissions: true };
            }
            throw error;
        }
    },

    deleteQuizForce: async (id: number): Promise<void> => {
        await api.delete(`/api/quizzes/${id}?force=true`);
    },

    publishQuiz: async (id: number): Promise<Quiz> => {
        const response = await api.post<Quiz>(`/api/quizzes/${id}/publish`);
        return response.data;
    },

    // Question Management
    addQuestion: async (quizId: number, question: Question): Promise<Question> => {
        const response = await api.post<Question>(`/api/quizzes/${quizId}/questions`, question);
        return response.data;
    },

    updateQuestion: async (quizId: number, questionId: number, question: Question): Promise<Question> => {
        const response = await api.put<Question>(`/api/quizzes/${quizId}/questions/${questionId}`, question);
        return response.data;
    },

    deleteQuestion: async (quizId: number, questionId: number): Promise<void> => {
        await api.delete(`/api/quizzes/${quizId}/questions/${questionId}`);
    },

    // Quiz Taking
    startQuiz: async (quizId: number): Promise<QuizSubmission> => {
        const response = await api.post<QuizSubmission>(`/api/quizzes/${quizId}/start`);
        return response.data;
    },

    submitQuiz: async (quizId: number, answers: Record<number, any>): Promise<QuizSubmission> => {
        const response = await api.post<QuizSubmission>(`/api/quizzes/${quizId}/submit`, { answers });
        return response.data;
    },

    getSubmission: async (quizId: number): Promise<QuizSubmission> => {
        const response = await api.get<QuizSubmission>(`/api/quizzes/${quizId}/submission`);
        return response.data;
    },

    getSubmissionById: async (submissionId: number): Promise<QuizSubmission> => {
        const response = await api.get<QuizSubmission>(`/api/submissions/${submissionId}`);
        return response.data;
    },

    // Analytics and Reports
    getQuizAnalytics: async (quizId: number): Promise<any> => {
        const response = await api.get(`/api/quizzes/${quizId}/analytics`);
        return response.data;
    },

    getQuizReport: async (quizId: number): Promise<any> => {
        const response = await api.get(`/api/quizzes/${quizId}/report`);
        return response.data;
    },
};