const { v4: uuidv4 } = require("uuid");
const { CB_Upsert } = require("../../../../utils/DB/Couchbase/CB_Helper");
const { SR_Query } = require("../../../../utils/DB/StarRocks/SR_Helper");

const Create_Dataset = async (req, res) => {
    try {
        const { name, table_name, database } = req.body;

        if (!name || !table_name) {
            return res.status(400).json({ error: "name and table_name are required." });
        }

        const db = database || process.env.SR_DATABASE || "bi_test";

        // Introspect StarRocks to get column info
        const columns_raw = await SR_Query(`DESCRIBE ${db}.${table_name}`);

        const columns = columns_raw.map((col) => ({
            name: col.Field,
            type: col.Type,
            role: ["INT", "BIGINT", "FLOAT", "DOUBLE", "DECIMAL"].some((t) =>
                col.Type.toUpperCase().includes(t)
            )
                ? "measure"
                : "dimension",
        }));

        const id = uuidv4();
        const doc = {
            id,
            name,
            table_name,
            database: db,
            columns,
            owner_id: req.user.id,
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
        };

        await CB_Upsert("datasets", id, doc);

        res.status(201).json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = Create_Dataset;