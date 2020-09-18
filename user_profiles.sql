DROP TABLE IF EXISTS user_profiles CASCADE;
  CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    age INT,
    city VARCHAR(255),
    url VARCHAR(512),
    user_id INT NOT NULL UNIQUE REFERENCES users(id)
  )