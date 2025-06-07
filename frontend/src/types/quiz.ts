export interface Answer {
    id?: number;
    questionId?: number;
    answerText: string;
    isCorrect?: boolean;
    order?: number;
}

export interface Question {
    id?: number;
    quizId?: number;
    questionText: string;
    type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
    points: number;
    order?: number;
    answers: Answer[];
}

export interface Quiz {
    id: number;
    title: string;
    description: string;
    instructorId: number;
    isPublished: boolean;
    timeLimit?: number;
    questions: Question[];
}

export interface QuizSubmission {
    id?: number;
    quizId: number;
    studentId: number;
    score?: number;
    answers: Record<number, number>;
    startedAt: Date;
    completedAt?: Date;
    submittedAt?: Date;
}

export interface User {
    id?: number;
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    role: 'STUDENT' | 'INSTRUCTOR';
    createdAt?: Date;
    updatedAt?: Date;
} 