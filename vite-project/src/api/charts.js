import API_BASE from "./config";

export const Create_Chart = async (chart) => {
    const res = await fetch(`${API_BASE}/charts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chart),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create chart");
    }
    return res.json();
};