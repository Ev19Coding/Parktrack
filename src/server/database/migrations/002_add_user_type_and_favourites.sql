-- Migration: 002_add_user_type_and_favourites.sql
-- Adds `favourites` (JSON) and `type` (role) columns to the "user" table
-- Designed for DuckDB / MotherDuck. Uses IF NOT EXISTS safeguards.
BEGIN TRANSACTION;

-- Add favourites column to store array of favourite location IDs as JSON.
-- Default to an empty array for new rows.
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS favourites JSON DEFAULT '[]';

-- Add type column to store user role. Default to 'user'.
ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS type VARCHAR NOT NULL DEFAULT 'user';

-- Backfill existing rows that may have NULL values for the new columns.
UPDATE "user"
SET
  favourites = COALESCE(favourites, '[]')
WHERE
  favourites IS NULL;

UPDATE "user"
SET type = COALESCE(type, 'user')
WHERE
  type IS NULL;

COMMIT;
