import { Quiz, Question, QuizSubmission, User } from '../types/quiz';

const API_BASE_URL = 'http://localhost:7000/api';

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = {};
        }
        
        const error: any = new Error(errorData.message || 'An error occurred');
        error.status = response.status;
        error.data = errorData;
        throw error;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : {};
};

const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const authService = {
    login: async (email: string, password: string): Promise<User> => {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        const data = await handleResponse(response);
        if (data.token) {
            localStorage.setItem('token', data.token);
        }
        return data.user;
    },

    register: async (email: string, password: string, firstName: string, lastName: string, role: 'STUDENT' | 'INSTRUCTOR'): Promise<User> => {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, firstName, lastName, role }),
        });
        const data = await handleResponse(response);
        if (data.token) {
            localStorage.setItem('token', data.token);
        }
        return data.user;
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    updateProfile: async (user: User): Promise<User> => {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(user),
        });
        return handleResponse(response);
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/users/me/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        return handleResponse(response);
    },

    logout: () => {
        localStorage.removeItem('token');
    },
};

export const quizService = {
    // Quiz Management
    createQuiz: async (quiz: Quiz): Promise<Quiz> => {
        const response = await fetch(`${API_BASE_URL}/quizzes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(quiz),
        });
        return handleResponse(response);
    },

    getQuizzes: async (): Promise<Quiz[]> => {
        const response = await fetch(`${API_BASE_URL}/quizzes`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    getQuiz: async (id: number): Promise<Quiz> => {
        const response = await fetch(`${API_BASE_URL}/quizzes/${id}`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    updateQuiz: async (id: number, quiz: Quiz): Promise<Quiz> => {
        const response = await fetch(`${API_BASE_URL}/quizzes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(quiz),
        });
        return handleResponse(response);
    },

    deleteQuiz: async (id: number): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/quizzes/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader(),
        });
        try {
            return await handleResponse(response);
        } catch (error: any) {
            if (error.status === 409 && error.data?.hasSubmissions) {
                return error.data;
            }
            throw error;
        }
    },

    deleteQuizForce: async (id: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/quizzes/${id}?force=true`, {
            method: 'DELETE',
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    publishQuiz: async (id: number): Promise<Quiz> => {
        const response = await fetch(`${API_BASE_URL}/quizzes/${id}/publish`, {
            method: 'POST',
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    // Question Management
    addQuestion: async (quizId: number, question: Question): Promise<Question> => {
        const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(question),
        });
        return handleResponse(response);
    },

    // Quiz Taking
    startQuiz: async (id: number): Promise<QuizSubmission> => {
        const response = await fetch(`${API_BASE_URL}/quizzes/${id}/start`, {
            method: 'POST',
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    submitQuiz: async (id: number, answers: Record<number, number>): Promise<QuizSubmission> => {
        const response = await fetch(`${API_BASE_URL}/quizzes/${id}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify({ answers }),
        });
        return handleResponse(response);
    },

    getSubmission: async (id: number): Promise<QuizSubmission> => {
        const response = await fetch(`${API_BASE_URL}/quizzes/${id}/submission`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    getSubmissionById: async (id: number): Promise<QuizSubmission> => {
        const response = await fetch(`${API_BASE_URL}/submissions/${id}`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },
};