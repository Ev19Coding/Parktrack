-- Better Auth Core Schema Migration for DuckDB/MotherDuck
-- Migration: 001_better_auth_core_schema.sql
-- Description: Creates the core tables required by Better Auth
-- User table - stores user account information
CREATE TABLE IF NOT EXISTS "user" (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  emailVerified BOOLEAN NOT NULL DEFAULT FALSE,
  image VARCHAR,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_email ON "user" (email);

-- Session table - stores user session information
CREATE TABLE IF NOT EXISTS "session" (
  id VARCHAR PRIMARY KEY,
  userId VARCHAR NOT NULL,
  token VARCHAR UNIQUE NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  ipAddress VARCHAR,
  userAgent VARCHAR,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES "user" (id)
);

-- Create indexes for session table
CREATE INDEX IF NOT EXISTS idx_session_token ON "session" (token);

CREATE INDEX IF NOT EXISTS idx_session_userId ON "session" (userId);

CREATE INDEX IF NOT EXISTS idx_session_expiresAt ON "session" (expiresAt);

-- Account table - stores OAuth and credential account information
CREATE TABLE IF NOT EXISTS "account" (
  id VARCHAR PRIMARY KEY,
  userId VARCHAR NOT NULL,
  accountId VARCHAR NOT NULL,
  providerId VARCHAR NOT NULL,
  accessToken VARCHAR,
  refreshToken VARCHAR,
  accessTokenExpiresAt TIMESTAMP,
  refreshTokenExpiresAt TIMESTAMP,
  scope VARCHAR,
  idToken VARCHAR,
  password VARCHAR,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES "user" (id)
);

-- Create indexes for account table
CREATE INDEX IF NOT EXISTS idx_account_userId ON "account" (userId);

CREATE INDEX IF NOT EXISTS idx_account_providerId ON "account" (providerId);

CREATE UNIQUE INDEX IF NOT EXISTS idx_account_provider_account ON "account" (providerId, accountId);

-- Verification table - stores email verification and password reset tokens
CREATE TABLE IF NOT EXISTS "verification" (
  id VARCHAR PRIMARY KEY,
  identifier VARCHAR NOT NULL,
  value VARCHAR NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for verification table
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON "verification" (identifier);

CREATE INDEX IF NOT EXISTS idx_verification_value ON "verification" (value);

CREATE INDEX IF NOT EXISTS idx_verification_expiresAt ON "verification" (expiresAt);

-- Create a unique index to prevent duplicate verification requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_identifier_value ON "verification" (identifier, value);
