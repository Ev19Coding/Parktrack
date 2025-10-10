CREATE TABLE IF NOT EXISTS "user_recreational_locations" (
  id BIGINT PRIMARY KEY,
  title VARCHAR NOT NULL,
  category VARCHAR NOT NULL DEFAULT 'Other',
  address VARCHAR NOT NULL DEFAULT 'N/A',
  link VARCHAR NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  thumbnail VARCHAR,
  images JSON,
  openHours JSON,
  popularTimes JSON,
  description TEXT,
  phone VARCHAR,
  website VARCHAR,
  emails JSON NOT NULL DEFAULT '[]',
  rating NUMERIC,
  reviewRating NUMERIC,
  reviewCount INTEGER,
  reviewsBreakdown JSON,
  reviewsPerRating JSON,
  priceRange VARCHAR,
  timezone VARCHAR,
  plusCode VARCHAR,
  dataId VARCHAR,
  reviewsLink VARCHAR,
  reservations JSON,
  orderOnline JSON,
  menu JSON,
  owner JSON,
  about JSON,
  userReviews JSON,
  userReviewsExtended JSON,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  isActive BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS id BIGINT;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS title VARCHAR;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'Other';

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS address VARCHAR DEFAULT 'N/A';

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS link VARCHAR;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS latitude DOUBLE;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS longitude DOUBLE;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS thumbnail VARCHAR;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS images JSON;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS openHours JSON;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS popularTimes JSON;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS phone VARCHAR;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS website VARCHAR;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS emails JSON DEFAULT '[]';

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS rating NUMERIC;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS reviewRating NUMERIC;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS reviewCount INTEGER;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS reviewsBreakdown JSON;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS reviewsPerRating JSON;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS priceRange VARCHAR;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS timezone VARCHAR;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS plusCode VARCHAR;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS dataId VARCHAR;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS reviewsLink VARCHAR;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS reservations JSON;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS orderOnline JSON;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS menu JSON;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS owner JSON;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS about JSON;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS userReviews JSON;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS userReviewsExtended JSON;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE user_recreational_locations
ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT TRUE;
