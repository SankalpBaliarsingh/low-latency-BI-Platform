const { createClient } = require("redis");

const Redis_Client = createClient({
    url: process.env.REDIS_URL,
});

Redis_Client.on("error", (err) => console.error("Redis error:", err.message));
Redis_Client.on("connect", () => console.log("Redis connected."));

module.exports = Redis_Client;