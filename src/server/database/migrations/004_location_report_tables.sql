CREATE SEQUENCE IF NOT EXISTS report_id_seq;

CREATE TABLE IF NOT EXISTS "report" (
  id BIGINT PRIMARY KEY DEFAULT nextval('report_id_seq'),
  locationId BIGINT NOT NULL,
  userId VARCHAR NOT NULL,
  title VARCHAR NOT NULL DEFAULT 'Other',
  message VARCHAR NOT NULL DEFAULT '',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  isResolved BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (userId) REFERENCES "user" (id),
  -- FOREIGN KEY (locationId) REFERENCES "user_recreational_locations" (id)
);

CREATE INDEX IF NOT EXISTS idx_report_userId ON "report" (userId);

CREATE INDEX IF NOT EXISTS idx_report_locationId ON "report" (locationId);

CREATE INDEX IF NOT EXISTS idx_report_isResolved ON "report" (isResolved);
