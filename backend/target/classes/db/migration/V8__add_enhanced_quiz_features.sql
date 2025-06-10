-- Add time_limit to questions table (in seconds)
ALTER TABLE questions ADD COLUMN time_limit INTEGER;

-- Create question_pools table
CREATE TABLE question_pools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create pool_questions table (mapping between pools and questions)
CREATE TABLE pool_questions (
    pool_id INTEGER REFERENCES question_pools(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    PRIMARY KEY (pool_id, question_id)
);

-- Create quiz_pools table (mapping between quizzes and pools)
CREATE TABLE quiz_pools (
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    pool_id INTEGER REFERENCES question_pools(id) ON DELETE CASCADE,
    num_questions INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (quiz_id, pool_id)
);

-- Add randomization flag to quizzes
ALTER TABLE quizzes ADD COLUMN randomize_questions BOOLEAN NOT NULL DEFAULT false;

-- Add file_upload_url to questions table for file upload questions
ALTER TABLE questions ADD COLUMN file_upload_url TEXT;

-- Create question_options table for multiple choice questions
CREATE TABLE question_options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_time_limit ON questions(time_limit);
CREATE INDEX idx_pool_questions_pool_id ON pool_questions(pool_id);
CREATE INDEX idx_pool_questions_question_id ON pool_questions(question_id);
CREATE INDEX idx_quiz_pools_quiz_id ON quiz_pools(quiz_id);
CREATE INDEX idx_quiz_pools_pool_id ON quiz_pools(pool_id);