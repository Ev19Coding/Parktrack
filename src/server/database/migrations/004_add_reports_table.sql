-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    location_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    email TEXT,
    photo BLOB,
    created_at TIMESTAMP NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    FOREIGN KEY(location_id) REFERENCES recreational_locations(id),
    FOREIGN KEY(owner_id) REFERENCES users(id)
);