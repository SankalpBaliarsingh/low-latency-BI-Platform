const { CB_List } = require("../../../../utils/DB/Couchbase/CB_Helper");

const List_Charts = async (req, res) => {
    try {
        const filters = {};
        if (req.query.dataset_id) {
            filters.dataset_id = req.query.dataset_id;
        }
        const charts = await CB_List("charts", filters);
        res.json(charts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = List_Charts;