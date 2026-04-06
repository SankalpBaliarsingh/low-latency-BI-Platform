const { SR_Query } = require("../../../../utils/DB/StarRocks/SR_Helper");

const BLOCKED_KEYWORDS = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "CREATE", "GRANT", "REVOKE"];

const Execute_Query = async (req, res) => {
    try {
        const { sql } = req.body;

        if (!sql || !sql.trim()) {
            return res.status(400).json({ error: "sql is required." });
        }

        // Block non-SELECT queries
        const first_word = sql.trim().split(/\s+/)[0].toUpperCase();
        if (BLOCKED_KEYWORDS.includes(first_word)) {
            return res.status(403).json({ error: `${first_word} queries are not allowed.` });
        }

        const start = Date.now();
        const rows = await SR_Query(sql);
        const execution_time_ms = Date.now() - start;

        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

        res.json({
            columns,
            rows,
            row_count: rows.length,
            execution_time_ms,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = Execute_Query;