import API_BASE from "./config";

export const Run_Query = async (sql) => {
    const res = await fetch(`${API_BASE}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Query failed");
    }
    return res.json();
};