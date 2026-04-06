const { v4: uuidv4 } = require("uuid");
const { CB_Upsert } = require("../../../../utils/DB/Couchbase/CB_Helper");

const Create_Dashboard = async (req, res) => {
    try {
        const { title, description, tags } = req.body;

        if (!title) {
            return res.status(400).json({ error: "title is required." });
        }

        const id = uuidv4();
        const doc = {
            id,
            title,
            description: description || "",
            owner_id: req.user.id,
            tags: tags || [],
            tabs: [
                {
                    key: uuidv4(),
                    label: "Tab 1",
                    order: 1,
                    layout: [],
                },
            ],
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
        };

        await CB_Upsert("dashboards", id, doc);

        res.status(201).json(doc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = Create_Dashboard;