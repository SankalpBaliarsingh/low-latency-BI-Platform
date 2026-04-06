const { CB_Get } = require("../../../../utils/DB/Couchbase/CB_Helper");
const { SR_Query } = require("../../../../utils/DB/StarRocks/SR_Helper");

const Get_Dataset_Preview = async (req, res) => {
    try {
        const dataset = await CB_Get("datasets", req.params.id);

        if (!dataset) {
            return res.status(404).json({ error: "Dataset not found." });
        }

        const limit = parseInt(req.query.limit) || 50;
        const rows = await SR_Query(
            `SELECT * FROM ${dataset.database}.${dataset.table_name} LIMIT ?`,
            [limit]
        );

        res.json({
            dataset_id: dataset.id,
            table_name: dataset.table_name,
            columns: dataset.columns,
            row_count: rows.length,
            rows,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = Get_Dataset_Preview;