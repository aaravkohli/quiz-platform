-- Add first_name and last_name columns to users table
ALTER TABLE users ADD COLUMN first_name VARCHAR(255);
ALTER TABLE users ADD COLUMN last_name VARCHAR(255);
-- Optionally drop the username column if not needed
ALTER TABLE users DROP COLUMN username; 