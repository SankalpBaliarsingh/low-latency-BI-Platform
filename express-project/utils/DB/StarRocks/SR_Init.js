const SR_Client = require("./SR_Client");
const With_Timeout = require("../../Basics/With_Timeout");

const SR_Init = async (timeout_ms = 5000) => {
    const [rows] = await With_Timeout(
        SR_Client.query("SELECT 1 AS ping"),
        timeout_ms,
        "StarRocks connection"
    );
    console.log(`StarRocks init verified: ping = ${rows[0].ping}`);
};

module.exports = SR_Init;