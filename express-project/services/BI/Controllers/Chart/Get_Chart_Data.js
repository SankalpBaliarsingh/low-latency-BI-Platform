const { CB_Get } = require("../../../../utils/DB/Couchbase/CB_Helper");
const { SR_Query } = require("../../../../utils/DB/StarRocks/SR_Helper");
const Build_Chart_Query = require("../../../../utils/DB/StarRocks/SR_Query_Builder");

const Get_Chart_Data = async (req, res) => {
    try {
        // Look up chart
        const chart = await CB_Get("charts", req.params.id);
        if (!chart) {
            return res.status(404).json({ error: "Chart not found." });
        }

        // Look up dataset
        const dataset = await CB_Get("datasets", chart.dataset_id);
        if (!dataset) {
            return res.status(404).json({ error: "Dataset not found." });
        }

        // Build SQL from chart config
        const sql = Build_Chart_Query(dataset, chart.config);

        // Run on StarRocks
        const rows = await SR_Query(sql);

        res.json({
            chart_id: chart.id,
            chart_name: chart.name,
            chart_type: chart.type,
            sql,
            row_count: rows.length,
            rows,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = Get_Chart_Data;