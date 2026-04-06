const { CB_Get } = require("../../../../utils/DB/Couchbase/CB_Helper");

const Get_Dashboard = async (req, res) => {
    try {
        const dashboard = await CB_Get("dashboards", req.params.id);
        if (!dashboard) {
            return res.status(404).json({ error: "Dashboard not found." });
        }

        // Collect all unique chart ids from all tabs
        const chart_ids = [];
        for (const tab of dashboard.tabs) {
            for (const item of tab.layout) {
                if (!chart_ids.includes(item.i)) {
                    chart_ids.push(item.i);
                }
            }
        }

        // Fetch all chart configs
        const charts = {};
        for (const chart_id of chart_ids) {
            const chart = await CB_Get("charts", chart_id);
            if (chart) {
                charts[chart_id] = chart;
            }
        }

        res.json({
            ...dashboard,
            charts,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = Get_Dashboard;