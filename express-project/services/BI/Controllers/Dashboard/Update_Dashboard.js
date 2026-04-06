const { CB_Get, CB_Upsert } = require("../../../../utils/DB/Couchbase/CB_Helper");

const Update_Dashboard = async (req, res) => {
    try {
        const existing = await CB_Get("dashboards", req.params.id);
        if (!existing) {
            return res.status(404).json({ error: "Dashboard not found." });
        }

        const { title, description, tags, tabs } = req.body;

        // Validate tabs if provided
        if (tabs) {
            for (const tab of tabs) {
                if (!tab.key || !tab.label) {
                    return res.status(400).json({ error: "Each tab must have a key and label." });
                }
                if (!Array.isArray(tab.layout)) {
                    return res.status(400).json({ error: "Each tab must have a layout array." });
                }
                // Validate layout items
                for (const item of tab.layout) {
                    if (item.i === undefined || item.x === undefined || item.y === undefined || item.w === undefined || item.h === undefined) {
                        return res.status(400).json({ error: "Layout items must have i, x, y, w, h." });
                    }
                }
            }
        }

        const updated = {
            ...existing,
            title: title || existing.title,
            description: description !== undefined ? description : existing.description,
            tags: tags || existing.tags,
            tabs: tabs || existing.tabs,
            modified_at: new Date().toISOString(),
        };

        await CB_Upsert("dashboards", req.params.id, updated);

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = Update_Dashboard;