const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/masala-petition"
);

// ------------- user.sql ------------- //
module.exports.addUser = (firstname, lastname, email, password) => {
    const q = `INSERT INTO users (firstname, lastname, email, password) VALUES ($1, $2, $3, $4) 
    RETURNING id, firstname`;

    const params = [firstname, lastname, email, password];
    return db.query(q, params);
};

module.exports.loginUser = (email) => {
    const q = `SELECT password, id FROM users WHERE email = $1`;
    const params = [email];
    return db.query(q, params);
};

// ------------- signatures.sql ------------- //

module.exports.addSignature = (signature, user_id) => {
    const q = `INSERT INTO signatures (signature, user_id ) VALUES ($1, $2)
    RETURNING id`;

    const params = [signature, user_id];
    return db.query(q, params);
};

module.exports.signedBy = () => {
    const q = `SELECT users.firstname, users.lastname, user_profiles.age, user_profiles.city, user_profiles.url
      FROM signatures JOIN users ON signatures.user_id = users.id LEFT JOIN user_profiles ON users.id = user_profiles.user_id;`;
    return db.query(q);
};

module.exports.signedByCity = (city) => {
    const q = `SELECT users.firstname, users.lastname, user_profiles.age, user_profiles.url
FROM signatures JOIN users ON signatures.user_id = users.id
JOIN user_profiles ON users.id = user_profiles.user_id
WHERE LOWER(city) = LOWER($1)`;
    const params = [city];
    return db.query(q, params);
};

module.exports.signedByNum = () => {
    const q = `SELECT COUNT (id) FROM signatures;`;
    return db.query(q);
};

module.exports.returnSignature = (user_id) => {
    const q = `SELECT signature FROM signatures WHERE user_id = $1 AND user_id IS NOT NULL`;
    const params = [user_id];
    return db.query(q, params);
};

// ------------- user_profiles.sql ------------- //
module.exports.addProfile = (age, city, url, user_id) => {
    const q = `INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4)`;
    const params = [age, city, url, user_id];
    return db.query(q, params);
};
