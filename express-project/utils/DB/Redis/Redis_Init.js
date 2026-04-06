const Redis_Client = require("./Redis_Client");
const With_Timeout = require("../../Basics/With_Timeout");

const Redis_Init = async (timeout_ms = 5000) => {
    await With_Timeout(Redis_Client.connect(), timeout_ms, "Redis connection");
    const pong = await Redis_Client.ping();
    console.log(`Redis init verified: ${pong}`);
};

module.exports = Redis_Init;