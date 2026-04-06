const { CB_Get, CB_Upsert } = require("../../../../utils/DB/Couchbase/CB_Helper");

const Update_Chart = async (req, res) => {
    try {
        const existing = await CB_Get("charts", req.params.id);
        if (!existing) {
            return res.status(404).json({ error: "Chart not found." });
        }

        const { name, type, dimensions, measures, filters, order_by, limit } = req.body;

        // If columns changed, validate against dataset
        if (dimensions || measures) {
            const dataset = await CB_Get("datasets", existing.dataset_id);
            if (!dataset) {
                return res.status(404).json({ error: "Dataset not found." });
            }

            const dataset_columns = dataset.columns.map((c) => c.name);

            if (dimensions) {
                for (const dim of dimensions) {
                    if (!dataset_columns.includes(dim)) {
                        return res.status(400).json({ error: `Column "${dim}" not found in dataset.` });
                    }
                }
            }

            if (measures) {
                for (const m of measures) {
                    if (!dataset_columns.includes(m.column)) {
                        return res.status(400).json({ error: `Column "${m.column}" not found in dataset.` });
                    }
                }
            }
        }

        const updated = {
            ...existing,
            name: name || existing.name,
            type: type || existing.type,
            config: {
                dimensions: dimensions || existing.config.dimensions,
                measures: measures || existing.config.measures,
                filters: filters || existing.config.filters,
                order_by: order_by !== undefined ? order_by : existing.config.order_by,
                limit: limit !== undefined ? limit : existing.config.limit,
            },
            modified_at: new Date().toISOString(),
        };

        await CB_Upsert("charts", req.params.id, updated);

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = Update_Chart;