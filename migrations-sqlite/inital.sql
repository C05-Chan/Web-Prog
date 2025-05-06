CREATE TABLE IF NOT EXISTS race_data (
  raceData_id INTEGER PRIMARY KEY AUTOINCREMENT,
  data_type TEXT NOT NULL CHECK (data_type IN ('times', 'runners', 'results')),
  data_array TEXT NOT NULL,
  client_id INT NOT NULL,
  time DATETIME,

  UNIQUE(clientID, data_type)
);

CREATE TABLE IF NOT EXISTS race_results (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    times_array TEXT NOT NULL DEFAULT '[]',
    runners_array TEXT NOT NULL DEFAULT '[]',
    time DATETIME
);
