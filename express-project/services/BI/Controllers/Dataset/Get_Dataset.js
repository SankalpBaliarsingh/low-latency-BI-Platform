const { CB_Get } = require("../../../../utils/DB/Couchbase/CB_Helper");

const Get_Dataset = async (req, res) => {
    try {
        const dataset = await CB_Get("datasets", req.params.id);

        if (!dataset) {
            return res.status(404).json({ error: "Dataset not found." });
        }

        res.json(dataset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = Get_Dataset;