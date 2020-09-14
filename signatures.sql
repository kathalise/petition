DROP TABLE IF EXISTS signatures;

  CREATE TABLE signatures (
      id SERIAL PRIMARY KEY,
      firstname VARCHAR(255) NOT NULL CHECK (firstname != ''),
      lastname VARCHAR(255) NOT NULL CHECK (lastname != ''),
      signature TEXT CHECK (signature != '')
  );