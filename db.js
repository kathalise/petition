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
    const q = `SELECT signature, id FROM signatures WHERE user_id = $1`;
    const params = [user_id];
    return db.query(q, params);
};

// ------------- user_profiles.sql ------------- //

module.exports.getFirstname = (user_id) => {
    const q = `SELECT firstname FROM users WHERE id = $1`;
    const params = [user_id];
    return db.query(q, params);
};

module.exports.addProfile = (age, city, url, user_id) => {
    const q = `INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4);`;
    const params = [age, city, url, user_id];
    return db.query(q, params);
};

module.exports.userProfileData = (user_id) => {
    const q = `SELECT users.firstname, users.lastname, users.email, users.password, user_profiles.age, user_profiles.city, user_profiles.url
    FROM users FULL JOIN user_profiles 
    ON users.id = user_profiles.user_id
    WHERE users.id = $1;`;
    const params = [user_id];
    return db.query(q, params);
};

// updating users (without pw)
module.exports.usersEdit = (firstname, lastname, email, user_id) => {
    const q = `UPDATE users SET firstname = $1, lastname = $2, email = $3
    WHERE users.id = $4;`;
    const params = [firstname, lastname, email, user_id];
    return db.query(q, params);
};

// updating user-profiles
module.exports.userProfilesEdit = (age, city, url, userId) => {
    const q = `INSERT INTO user_profiles (age, city, url, user_id) 
    VALUES ($1, $2, $3, $4) ON CONFLICT (user_id)
    DO UPDATE SET age=$1, city=$2, url=$3;`;
    const params = [age, city, url, userId];
    return db.query(q, params);
};

module.exports.usersWithPasswordEdit = (first, last, email, pw, user_id) => {
    const q = `UPDATE users SET firstname=$1, lastname=$2, email=$3, password=$4
    WHERE users.id=$5;`;

    const params = [first, last, email, pw, user_id];
    return db.query(q, params);
};

module.exports.deleteSig = (user_id) => {
    const q = `DELETE FROM signatures WHERE user_id=$1;`;
    const params = [user_id];
    return db.query(q, params);
};

/// DELETE ACCOUNT ////
module.exports.deleteUsers = (user_id) => {
    const q = `DELETE FROM users WHERE id = ($1)`;
    const params = [user_id];
    return db.query(q, params);
};

module.exports.deleteSig = (user_id) => {
    const q = `DELETE FROM signatures WHERE user_id = ($1)`;
    const params = [user_id];
    return db.query(q, params);
};

module.exports.deleteUserProfiles = (user_id) => {
    const q = `DELETE FROM user_profiles WHERE user_id = ($1)`;
    const params = [user_id];
    return db.query(q, params);
};
