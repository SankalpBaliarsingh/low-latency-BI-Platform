const { CB_Query } = require("../../../../utils/DB/Couchbase/CB_Helper");

const List_Dashboards = async (req, res) => {
    try {
        const bucket = process.env.CB_BUCKET;

        // Return metadata only — no tabs, no chart data
        const rows = await CB_Query(
            `SELECT d.id, d.title, d.description, d.owner_id, d.tags,
                    d.created_at, d.modified_at,
                    ARRAY_LENGTH(d.tabs) AS tab_count
             FROM \`${bucket}\`._default.dashboards d
             ORDER BY d.modified_at DESC`
        );

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = List_Dashboards;