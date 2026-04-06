const { Get_Cluster, Get_Collection } = require("./CB_Client");

// ─── Validation ─────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const Validate_ID = (id) => {
    if (!id || typeof id !== "string") throw new Error("Invalid document ID.");
    if (!UUID_REGEX.test(id)) throw new Error(`Invalid UUID format: ${id}`);
};

// ─── KV Operations ──────────────────────────────────────────

const CB_Get = async (collection_name, doc_id) => {
    Validate_ID(doc_id);
    const collection = Get_Collection(collection_name);
    const key = `${collection_name}::${doc_id}`;

    try {
        const result = await collection.get(key);
        return result.content;
    } catch (err) {
        if (err.name === "DocumentNotFoundError") return null;
        throw err;
    }
};

const CB_Upsert = async (collection_name, doc_id, doc) => {
    Validate_ID(doc_id);
    if (!doc || typeof doc !== "object") throw new Error("Document must be an object.");
    const collection = Get_Collection(collection_name);
    const key = `${collection_name}::${doc_id}`;
    await collection.upsert(key, doc);
    return { id: doc_id, key };
};

const CB_Remove = async (collection_name, doc_id) => {
    Validate_ID(doc_id);
    const collection = Get_Collection(collection_name);
    const key = `${collection_name}::${doc_id}`;

    try {
        await collection.remove(key);
        return { removed: true, key };
    } catch (err) {
        if (err.name === "DocumentNotFoundError") return { removed: false, key };
        throw err;
    }
};

// ─── N1QL Operations ────────────────────────────────────────

const CB_Query = async (n1ql, params = {}) => {
    const cluster = Get_Cluster();
    const result = await cluster.query(n1ql, { parameters: params });
    return result.rows;
};

const CB_List = async (collection_name, filters = {}) => {
    const bucket = process.env.CB_BUCKET;
    let n1ql = `SELECT META().id AS _key, d.* FROM \`${bucket}\`._default.\`${collection_name}\` d`;
    const conditions = [];
    const params = {};

    for (const [field, value] of Object.entries(filters)) {
        const param_name = `$${field}`;
        conditions.push(`d.\`${field}\` = ${param_name}`);
        params[param_name] = value;
    }

    if (conditions.length > 0) {
        n1ql += ` WHERE ${conditions.join(" AND ")}`;
    }

    n1ql += " ORDER BY META().id";

    const cluster = Get_Cluster();
    const result = await cluster.query(n1ql, { parameters: params });
    return result.rows;
};

module.exports = { CB_Get, CB_Upsert, CB_Remove, CB_Query, CB_List };