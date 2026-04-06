import API_BASE from "./config";

export const Create_Dataset = async (name, table_name, database) => {
    const res = await fetch(`${API_BASE}/datasets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, table_name, database }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create dataset");
    }
    return res.json();
};

export const Fetch_Datasets = async () => {
    const res = await fetch(`${API_BASE}/datasets`);
    if (!res.ok) throw new Error("Failed to fetch datasets");
    return res.json();
};

export const Fetch_Dataset = async (id) => {
    const res = await fetch(`${API_BASE}/datasets/${id}`);
    if (!res.ok) throw new Error("Failed to fetch dataset");
    return res.json();
};