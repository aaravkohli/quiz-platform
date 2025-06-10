import { Quiz, Question, QuizSubmission, User } from '../types/quiz';
import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:7000/api';

export const api = axios.create({
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
    console.log('API response status:', response.status);
    
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
    console.log('API response data:', data);
    
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
        const response = await fetch(`${baseURL}/users/login`, {
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
        const response = await fetch(`${baseURL}/users/register`, {
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
        const response = await fetch(`${baseURL}/users/me`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    updateProfile: async (user: User): Promise<User> => {
        const response = await fetch(`${baseURL}/users/me`, {
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
        const response = await fetch(`${baseURL}/users/me/password`, {
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
        console.log('API createQuiz called with:', quiz);
        const response = await fetch(`${baseURL}/quizzes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(quiz),
        });
        const data = await handleResponse(response);
        console.log('API createQuiz response:', data);
        return data;
    },

    getQuizzes: async (): Promise<Quiz[]> => {
        const response = await fetch(`${baseURL}/quizzes`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    getQuiz: async (id: number): Promise<Quiz> => {
        const response = await fetch(`${baseURL}/quizzes/${id}`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    getQuizAttempts: async (id: number): Promise<QuizSubmission[]> => {
        const response = await fetch(`${baseURL}/quizzes/${id}/attempts`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    updateQuiz: async (id: number, quiz: Quiz): Promise<Quiz> => {
        const response = await fetch(`${baseURL}/quizzes/${id}`, {
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
        const response = await fetch(`${baseURL}/quizzes/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader(),
        });
        try {
            const data = await handleResponse(response);
            // If response is empty but status is 204 (No Content) or 200 (OK), consider it successful
            if (!data && (response.status === 204 || response.status === 200)) {
                return { success: true };
            }
            return data;
        } catch (error: any) {
            // If we get a 409 Conflict, it means the quiz has submissions
            if (error.status === 409) {
                return { hasSubmissions: true };
            }
            throw error;
        }
    },

    deleteQuizForce: async (id: number): Promise<void> => {
        const response = await fetch(`${baseURL}/quizzes/${id}?force=true`, {
            method: 'DELETE',
            headers: getAuthHeader(),
        });
        try {
            await handleResponse(response);
        } catch (error: any) {
            if (error.status === 409) {
                throw new Error('Cannot force delete quiz with submissions');
            }
            throw error;
        }
    },

    publishQuiz: async (id: number): Promise<Quiz> => {
        const response = await fetch(`${baseURL}/quizzes/${id}/publish`, {
            method: 'POST',
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    // Question Management
    addQuestion: async (quizId: number, question: Question): Promise<Question> => {
        const response = await fetch(`${baseURL}/quizzes/${quizId}/questions`, {
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
        const response = await fetch(`${baseURL}/quizzes/${id}/start`, {
            method: 'POST',
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    submitQuiz: async (quizId: number, answers: Record<number, number | string>): Promise<QuizSubmission> => {
        // Get the quiz first to check question types
        const quiz = await quizService.getQuiz(quizId);
        
        // Format answers based on question type
        const formattedAnswers = Object.entries(answers).reduce((acc, [questionId, answer]) => {
            const qId = parseInt(questionId, 10);
            const question = quiz.questions?.find(q => q.id === qId);
            
            if (!question) {
                return acc;
            }

            // Format answer based on question type
            switch (question.type) {
                case 'MULTIPLE_CHOICE':
                case 'TRUE_FALSE':
                    // These must be numbers (answer IDs)
                    if (typeof answer === 'number') {
                        acc[qId] = answer;
                    } else if (typeof answer === 'string') {
                        const numAnswer = parseInt(answer, 10);
                        if (!isNaN(numAnswer)) {
                            acc[qId] = numAnswer;
                        }
                    }
                    break;
                case 'SHORT_ANSWER':
                    // For short answers, send the text
                    acc[qId] = String(answer).trim();
                    break;
                default:
                    acc[qId] = String(answer).trim();
            }
            return acc;
        }, {} as Record<number, number | string>);

        console.log('Submitting answers:', formattedAnswers);

        const response = await fetch(`${baseURL}/quizzes/${quizId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify({ answers: formattedAnswers }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error response:', errorData);
            throw {
                status: response.status,
                data: errorData
            };
        }

        return handleResponse(response);
    },

    getSubmission: async (id: number): Promise<QuizSubmission> => {
        const response = await fetch(`${baseURL}/quizzes/${id}/submission`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    getSubmissionById: async (id: number): Promise<QuizSubmission> => {
        const response = await fetch(`${baseURL}/submissions/${id}`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    getQuizAnalytics: async (id: number): Promise<any> => {
        const response = await fetch(`${baseURL}/quizzes/${id}/analytics`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    getQuizReport: async (id: number): Promise<any> => {
        const response = await fetch(`${baseURL}/quizzes/${id}/report`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },
};