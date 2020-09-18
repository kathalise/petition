var redis = require("redis");
const { promisify } = require("util");
var client = redis.createClient({
    host: "localhost",
    port: 6379,
});

client.on("error", function (err) {
    console.log(err);
});

// client.set("muffin", "chocolate", (err, data) => {
//     console.log("log in SET", err, data);
// });

// client.get("muffin", (err, data) => {
//     console.log("log in GET", err, data);
// });

module.exports.set = promisify(client.set).bind(client);
module.exports.get = promisify(client.get).bind(client);
module.exports.del = promisify(client.del).bind(client);
module.exports.setex = promisify(client.setex).bind(client);
