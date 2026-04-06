import API_BASE from "./config";

export const Fetch_Dashboards = async () => {
    const res = await fetch(`${API_BASE}/dashboards`);
    if (!res.ok) throw new Error("Failed to fetch dashboards");
    return res.json();
};

export const Fetch_Dashboard = async (id) => {
    const res = await fetch(`${API_BASE}/dashboards/${id}`);
    if (!res.ok) throw new Error("Failed to fetch dashboard");
    return res.json();
};

export const Fetch_Chart_Data = async (chart_id) => {
    const res = await fetch(`${API_BASE}/charts/${chart_id}/data`);
    if (!res.ok) throw new Error("Failed to fetch chart data");
    return res.json();
};