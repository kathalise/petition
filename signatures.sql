DROP TABLE IF EXISTS signatures;

  CREATE TABLE signatures (
      id SERIAL PRIMARY KEY,
      firstname VARCHAR NOT NULL CHECK (first != ''),
      firstname VARCHAR NOT NULL CHECK (last != ''),
      signature TEXT NOT NULL CHECK (signature != '')
  );