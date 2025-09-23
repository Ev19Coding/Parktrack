-- Migration: 002_add_user_favourites_and_type.sql
-- Description: Add user type column to user table
-- Created: 2024-12-19
-- Add type column to distinguish user roles
ALTER TABLE "user"
ADD COLUMN type VARCHAR;

-- Update existing users with default value
UPDATE "user"
SET type = 'user'
WHERE
  type IS NULL;

-- Create index on user type for efficient filtering
CREATE INDEX IF NOT EXISTS idx_user_type ON "user" (type);

-- Note: favourites column already exists in the table
-- Note: DuckDB doesn't support adding NOT NULL constraints with ALTER TABLE
-- The application layer will enforce validation using the schema
