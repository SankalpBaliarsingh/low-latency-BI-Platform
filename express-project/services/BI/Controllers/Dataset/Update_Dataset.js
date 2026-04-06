const { CB_Get, CB_Upsert } = require("../../../../utils/DB/Couchbase/CB_Helper");
const { SR_Query } = require("../../../../utils/DB/StarRocks/SR_Helper");

const Update_Dataset = async (req, res) => {
    try {
        const existing = await CB_Get("datasets", req.params.id);

        if (!existing) {
            return res.status(404).json({ error: "Dataset not found." });
        }

        const { name, table_name, database } = req.body;

        // If table changed, re-introspect columns
        let columns = existing.columns;
        if (table_name && table_name !== existing.table_name) {
            const db = database || existing.database;
            const columns_raw = await SR_Query(`DESCRIBE ${db}.${table_name}`);
            columns = columns_raw.map((col) => ({
                name: col.Field,
                type: col.Type,
                role: ["INT", "BIGINT", "FLOAT", "DOUBLE", "DECIMAL"].some((t) =>
                    col.Type.toUpperCase().includes(t)
                )
                    ? "measure"
                    : "dimension",
            }));
        }

        const updated = {
            ...existing,
            name: name || existing.name,
            table_name: table_name || existing.table_name,
            database: database || existing.database,
            columns,
            modified_at: new Date().toISOString(),
        };

        await CB_Upsert("datasets", req.params.id, updated);

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = Update_Dataset;