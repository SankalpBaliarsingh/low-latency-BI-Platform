const mysql = require("mysql2");

const SR_Pool = mysql.createPool({
    host: process.env.SR_HOST || "192.168.1.12",
    port: parseInt(process.env.SR_PORT) || 9030,
    user: process.env.SR_USER || "root",
    password: process.env.SR_PASSWORD || "",
    database: process.env.SR_DATABASE || "bi_test",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

module.exports = SR_Pool.promise();