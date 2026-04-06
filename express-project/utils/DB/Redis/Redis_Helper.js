const Redis_Client = require("./Redis_Client");

const Redis_Get = async (key) => {
    const value = await Redis_Client.get(key);
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

const Redis_Set = async (key, value, ttl_seconds = null) => {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    if (ttl_seconds) {
        await Redis_Client.set(key, serialized, { EX: ttl_seconds });
    } else {
        await Redis_Client.set(key, serialized);
    }
};

const Redis_Delete = async (key) => {
    await Redis_Client.del(key);
};

const Redis_Exists = async (key) => {
    const result = await Redis_Client.exists(key);
    return result === 1;
};

module.exports = { Redis_Get, Redis_Set, Redis_Delete, Redis_Exists };