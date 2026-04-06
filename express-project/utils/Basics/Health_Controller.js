const With_Timeout = require("./With_Timeout");
const Redis_Client = require("../DB/Redis/Redis_Client");
const { Get_Cluster } = require("../DB/Couchbase/CB_Client");
const SR_Client = require("../DB/StarRocks/SR_Client");

const HEALTH_TIMEOUT_MS = 5000;

const Check_Redis = async () => {
    const start = Date.now();
    const pong = await Redis_Client.ping();
    return { service: "redis", status: pong === "PONG" ? "ok" : "error", latency_ms: Date.now() - start };
};

const Check_Couchbase = async () => {
    const start = Date.now();
    const cluster = Get_Cluster();
    await cluster.query("SELECT 1");
    return { service: "couchbase", status: "ok", latency_ms: Date.now() - start };
};

const Check_StarRocks = async () => {
    const start = Date.now();
    const [rows] = await SR_Client.query("SELECT 1 AS ping");
    return { service: "starrocks", status: rows[0].ping === 1 ? "ok" : "error", latency_ms: Date.now() - start };
};

const Wrap_Check = async (check_fn) => {
    try {
        return await With_Timeout(check_fn(), HEALTH_TIMEOUT_MS, check_fn.name);
    } catch (err) {
        return {
            service: check_fn.name,
            status: err.message.includes("timed out") ? "timeout" : "error",
            error: err.message,
        };
    }
};

const Health_Controller = async (req, res) => {
    const results = await Promise.allSettled([
        Wrap_Check(Check_Redis),
        Wrap_Check(Check_Couchbase),
        Wrap_Check(Check_StarRocks),
    ]);

    const checks = {};
    results.forEach((r) => {
        const value = r.value;
        checks[value.service] = value;
    });

    const all_ok = Object.values(checks).every((c) => c.status === "ok");
    const all_down = Object.values(checks).every((c) => c.status !== "ok");

    res.json({
        status: all_ok ? "ok" : all_down ? "error" : "degraded",
        uptime_seconds: Math.floor(process.uptime()),
        checks,
    });
};

module.exports = Health_Controller;