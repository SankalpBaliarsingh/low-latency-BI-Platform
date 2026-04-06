const couchbase = require("couchbase");

let cluster, bucket, collections;

const Connect = async () => {
    cluster = await couchbase.connect(process.env.CB_CONN_STRING, {
        username: process.env.CB_USERNAME,
        password: process.env.CB_PASSWORD,
    });

    bucket = cluster.bucket(process.env.CB_BUCKET);
    const scope = bucket.defaultScope();

    collections = {
        users: scope.collection("users"),
        user_roles: scope.collection("user_roles"),
        dashboards: scope.collection("dashboards"),
        charts: scope.collection("charts"),
        datasets: scope.collection("datasets"),
        activity_log: scope.collection("activity_log"),
    };
};

const Get_Cluster = () => {
    if (!cluster) throw new Error("Couchbase not connected.");
    return cluster;
};

const Get_Collection = (name) => {
    if (!collections) throw new Error("Couchbase not connected.");
    if (!collections[name]) throw new Error(`Collection "${name}" not found.`);
    return collections[name];
};

module.exports = { Connect, Get_Cluster, Get_Collection };