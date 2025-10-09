
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY,
  location_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  FOREIGN KEY(location_id) REFERENCES recreational_locations(id),
  FOREIGN KEY(owner_id) REFERENCES user(id)
);