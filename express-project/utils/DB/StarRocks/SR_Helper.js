const SR_Client = require("./SR_Client");

const SR_Query = async (sql, params = []) => {
    const [rows] = await SR_Client.query(sql, params);
    return rows;
};

const SR_Query_Single = async (sql, params = []) => {
    const [rows] = await SR_Client.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
};

module.exports = { SR_Query, SR_Query_Single };
