const { Connect, Get_Cluster } = require("./CB_Client");
const With_Timeout = require("../../Basics/With_Timeout");

const CB_Init = async (timeout_ms = 5000) => {
    await With_Timeout(Connect(), timeout_ms, "Couchbase connection");
    const cluster = Get_Cluster();
    const result = await cluster.query("SELECT 1");
    console.log(`Couchbase init verified: ${JSON.stringify(result.rows)}`);
};

module.exports = CB_Init;