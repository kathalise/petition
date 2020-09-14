const spicedPg = require("spiced-pg");
const db = spicedPg(
    "postgres:postgres:postgres@localhost:5432/masala-petition"
);

module.exports.addData = (firstname, lastname, signature) => {
    const q = `INSERT INTO signatures (firstname, lastname, signature) VALUES ($1, $2, $3) RETURNING id, firstname`;

    const params = [firstname, lastname, signature];
    return db.query(q, params);
};

module.exports.signedBy = () => {
    const q = `SELECT firstname, lastname FROM signatures;`;
    return db.query(q);
};

module.exports.signedByNum = () => {
    const q = `SELECT COUNT (firstname) FROM signatures;`;
    return db.query(q);
};

module.exports.addSignature = (id) => {
    const q = `SELECT signature FROM signatures WHERE id=$1`;
    const params = [id];
    return db.query(q, params);
};
