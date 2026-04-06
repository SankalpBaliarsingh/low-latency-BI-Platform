const { CB_Remove } = require("../../../../utils/DB/Couchbase/CB_Helper");

const Delete_Chart = async (req, res) => {
    try {
        const result = await CB_Remove("charts", req.params.id);
        if (!result.removed) {
            return res.status(404).json({ error: "Chart not found." });
        }
        res.json({ message: "Chart deleted.", id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = Delete_Chart;