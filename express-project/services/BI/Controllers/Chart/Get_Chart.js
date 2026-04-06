const { CB_Get } = require("../../../../utils/DB/Couchbase/CB_Helper");

const Get_Chart = async (req, res) => {
    try {
        const chart = await CB_Get("charts", req.params.id);
        if (!chart) {
            return res.status(404).json({ error: "Chart not found." });
        }

        // Include dataset info
        const dataset = await CB_Get("datasets", chart.dataset_id);

        res.json({
            ...chart,
            dataset: dataset || null,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = Get_Chart;