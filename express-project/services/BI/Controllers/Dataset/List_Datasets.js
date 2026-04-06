const { CB_List } = require("../../../../utils/DB/Couchbase/CB_Helper");

const List_Datasets = async (req, res) => {
    try {
        const datasets = await CB_List("datasets");
        res.json(datasets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = List_Datasets;