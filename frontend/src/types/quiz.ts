export enum QuestionType {
    MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
    TRUE_FALSE = 'TRUE_FALSE',
    SHORT_ANSWER = 'SHORT_ANSWER',
    FILE_UPLOAD = 'FILE_UPLOAD'
}

export interface Answer {
    id?: number;
    answerText: string;
    isCorrect: boolean;
}

export interface Question {
    id?: number;
    quizId?: number;
    questionText: string;
    type: QuestionType;
    points: number;
    answers: Answer[];
    order?: number;
}

export interface Quiz {
    id?: number;
    title: string;
    description: string;
    instructorId?: number;
    timeLimit?: number;
    isPublished?: boolean;
    questions?: Question[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface QuizSubmission {
    id?: number;
    quizId: number;
    studentId: number;
    score: number;
    startedAt: Date;
    completedAt?: Date;
    submittedAt?: Date;
    answers: Record<number, number | string>;
}

export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: 'STUDENT' | 'INSTRUCTOR';
} 