const { v4: uuidv4 } = require("uuid");
const { CB_Get, CB_Upsert } = require("../../../../utils/DB/Couchbase/CB_Helper");

const Create_Chart = async (req, res) => {
    try {
        const { name, type, dataset_id, dimensions, measures, filters, order_by, limit } = req.body;

        if (!name || !type || !dataset_id) {
            return res.status(400).json({ error: "name, type, and dataset_id are required." });
        }

        // Validate dataset exists
        const dataset = await CB_Get("datasets", dataset_id);
        if (!dataset) {
            return res.status(404).json({ error: "Dataset not found." });
        }

        // Validate columns exist in dataset
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

        const id = uuidv4();
        const doc = {
            id,
            name,
            type,
            dataset_id,
            config: {
                dimensions: dimensions || [],
                measures: measures || [],
                filters: filters || [],
                order_by: order_by || null,
                limit: limit || null,
            },
            owner_id: req.user.id,
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
        };

        await CB_Upsert("charts", id, doc);

        res.status(201).json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = Create_Chart;