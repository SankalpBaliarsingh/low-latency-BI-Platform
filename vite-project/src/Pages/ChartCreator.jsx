import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Fetch_Datasets, Fetch_Dataset } from "../api/datasets";
import { Run_Query } from "../api/query";
import { Create_Chart } from "../api/charts";
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const COLORS = ["#1677ff", "#52c41a", "#faad14", "#f5222d", "#722ed1", "#13c2c2"];
const CHART_TYPES = ["bar", "line", "pie", "table"];
const AGGREGATIONS = ["sum", "avg", "count", "min", "max"];

function ChartPreview({ type, data, dimensions, measures }) {
    if (!data || data.length === 0) return null;

    const x_axis = dimensions[0];
    const measure_cols = measures.map((m) => m.column);

    if (type === "bar") {
        return (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={x_axis} tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    {measure_cols.map((m, i) => (
                        <Bar key={m} dataKey={m} fill={COLORS[i % COLORS.length]} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        );
    }

    if (type === "line") {
        return (
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={x_axis} tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    {measure_cols.map((m, i) => (
                        <Line key={m} type="monotone" dataKey={m} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        );
    }

    if (type === "pie") {
        return (
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey={measure_cols[0]}
                        nameKey={x_axis}
                        cx="50%"
                        cy="50%"
                        outerRadius="70%"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {data.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        );
    }

    if (type === "table") {
        const cols = [...dimensions, ...measure_cols];
        return (
            <div style={{ overflow: "auto", maxHeight: 300, fontSize: 13 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            {cols.map((c) => (
                                <th key={c} style={{ padding: "6px 10px", textAlign: "left", borderBottom: "2px solid #ddd", background: "#fafafa" }}>{c}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i}>
                                {cols.map((c) => (
                                    <td key={c} style={{ padding: "5px 10px", borderBottom: "1px solid #eee" }}>{row[c]}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return null;
}

function ChartCreator() {
    const navigate = useNavigate();

    const [datasets, setDatasets] = useState([]);
    const [selectedDatasetId, setSelectedDatasetId] = useState("");
    const [dataset, setDataset] = useState(null);

    const [chartName, setChartName] = useState("");
    const [chartType, setChartType] = useState("bar");
    const [dimensions, setDimensions] = useState([]);
    const [measures, setMeasures] = useState([]);

    const [previewData, setPreviewData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [saveMsg, setSaveMsg] = useState(null);

    // Load datasets
    useEffect(() => {
        Fetch_Datasets().then(setDatasets).catch(console.error);
    }, []);

    // Load dataset columns when selected
    useEffect(() => {
        if (!selectedDatasetId) {
            setDataset(null);
            setDimensions([]);
            setMeasures([]);
            return;
        }
        Fetch_Dataset(selectedDatasetId).then(setDataset).catch(console.error);
    }, [selectedDatasetId]);

    const dimension_columns = dataset?.columns?.filter((c) => c.role === "dimension") || [];
    const measure_columns = dataset?.columns?.filter((c) => c.role === "measure") || [];

    const handleAddMeasure = () => {
        if (measure_columns.length > 0) {
            setMeasures([...measures, { column: measure_columns[0].name, aggregation: "sum" }]);
        }
    };

    const handleRemoveMeasure = (index) => {
        setMeasures(measures.filter((_, i) => i !== index));
    };

    const handleMeasureChange = (index, field, value) => {
        const updated = [...measures];
        updated[index] = { ...updated[index], [field]: value };
        setMeasures(updated);
    };

    const buildPreviewSQL = () => {
        if (!dataset || dimensions.length === 0 || measures.length === 0) return null;

        const select_dims = dimensions.join(", ");
        const select_measures = measures
            .map((m) => `${m.aggregation.toUpperCase()}(${m.column}) as ${m.column}`)
            .join(", ");
        const table = `${dataset.database}.${dataset.table_name}`;
        const group_by = dimensions.join(", ");

        return `SELECT ${select_dims}, ${select_measures} FROM ${table} GROUP BY ${group_by}`;
    };

    const handlePreview = async () => {
        const sql = buildPreviewSQL();
        if (!sql) {
            setError("Select dimensions and measures first.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const result = await Run_Query(sql);
            setPreviewData(result.rows);
        } catch (err) {
            setError(err.message);
            setPreviewData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!chartName.trim()) {
            setError("Enter a chart name.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const chart = await Create_Chart({
                name: chartName,
                type: chartType,
                dataset_id: selectedDatasetId,
                dimensions,
                measures,
                filters: [],
                order_by: null,
                limit: null,
            });
            setSaveMsg(`Chart "${chart.name}" saved!`);
            setTimeout(() => navigate("/charts"), 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ display: "flex", gap: 24, height: "calc(100vh - 100px)" }}>
            {/* Left — Config */}
            <div style={{ width: "35%", display: "flex", flexDirection: "column", gap: 12, overflow: "auto" }}>
                <h3 style={{ margin: 0 }}>Create Chart</h3>

                {/* Chart Name */}
                <input
                    type="text"
                    placeholder="Chart name"
                    value={chartName}
                    onChange={(e) => setChartName(e.target.value)}
                    style={{ padding: 8, border: "1px solid #ddd", borderRadius: 4, fontSize: 14 }}
                />

                {/* Dataset Picker */}
                <select
                    value={selectedDatasetId}
                    onChange={(e) => setSelectedDatasetId(e.target.value)}
                    style={{ padding: 8, border: "1px solid #ddd", borderRadius: 4, fontSize: 14 }}
                >
                    <option value="">Select dataset...</option>
                    {datasets.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>

                {/* Chart Type */}
                {dataset && (
                    <div style={{ display: "flex", gap: 8 }}>
                        {CHART_TYPES.map((t) => (
                            <button
                                key={t}
                                onClick={() => setChartType(t)}
                                style={{
                                    flex: 1,
                                    padding: "6px 0",
                                    border: chartType === t ? "2px solid #1677ff" : "1px solid #ddd",
                                    borderRadius: 4,
                                    background: chartType === t ? "#e6f4ff" : "#fff",
                                    cursor: "pointer",
                                    fontWeight: chartType === t ? 700 : 400,
                                    textTransform: "capitalize",
                                    fontSize: 13,
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                )}

                {/* Dimensions */}
                {dataset && (
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Dimensions (GROUP BY)</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {dimension_columns.map((col) => (
                                <button
                                    key={col.name}
                                    onClick={() => {
                                        if (dimensions.includes(col.name)) {
                                            setDimensions(dimensions.filter((d) => d !== col.name));
                                        } else {
                                            setDimensions([...dimensions, col.name]);
                                        }
                                    }}
                                    style={{
                                        padding: "4px 10px",
                                        border: dimensions.includes(col.name) ? "2px solid #1677ff" : "1px solid #ddd",
                                        borderRadius: 4,
                                        background: dimensions.includes(col.name) ? "#e6f4ff" : "#fff",
                                        cursor: "pointer",
                                        fontSize: 12,
                                    }}
                                >
                                    {col.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Measures */}
                {dataset && (
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>Measures</span>
                            <button onClick={handleAddMeasure} style={{ fontSize: 12, cursor: "pointer", border: "1px solid #ddd", borderRadius: 4, padding: "2px 8px" }}>+ Add</button>
                        </div>
                        {measures.map((m, i) => (
                            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                                <select
                                    value={m.column}
                                    onChange={(e) => handleMeasureChange(i, "column", e.target.value)}
                                    style={{ flex: 1, padding: 6, border: "1px solid #ddd", borderRadius: 4, fontSize: 12 }}
                                >
                                    {measure_columns.map((c) => (
                                        <option key={c.name} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={m.aggregation}
                                    onChange={(e) => handleMeasureChange(i, "aggregation", e.target.value)}
                                    style={{ width: 80, padding: 6, border: "1px solid #ddd", borderRadius: 4, fontSize: 12 }}
                                >
                                    {AGGREGATIONS.map((a) => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => handleRemoveMeasure(i)}
                                    style={{ padding: "4px 8px", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", fontSize: 12, color: "red" }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Buttons */}
                {dataset && (
                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            onClick={handlePreview}
                            disabled={loading || dimensions.length === 0 || measures.length === 0}
                            style={{
                                flex: 1,
                                padding: "8px 16px",
                                background: loading ? "#ccc" : "#1677ff",
                                color: "#fff",
                                border: "none",
                                borderRadius: 4,
                                cursor: loading ? "default" : "pointer",
                                fontWeight: 600,
                            }}
                        >
                            {loading ? "Loading..." : "Preview"}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !chartName.trim() || !previewData}
                            style={{
                                flex: 1,
                                padding: "8px 16px",
                                background: saving ? "#ccc" : "#52c41a",
                                color: "#fff",
                                border: "none",
                                borderRadius: 4,
                                cursor: saving ? "default" : "pointer",
                                fontWeight: 600,
                            }}
                        >
                            {saving ? "Saving..." : "Save Chart"}
                        </button>
                    </div>
                )}

                {error && <div style={{ fontSize: 12, color: "red" }}>{error}</div>}
                {saveMsg && <div style={{ fontSize: 12, color: "#52c41a" }}>{saveMsg}</div>}
            </div>

            {/* Right — Preview */}
            <div style={{ width: "65%", border: "1px solid #ddd", borderRadius: 4, padding: 16, overflow: "auto" }}>
                {!previewData && (
                    <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>
                        Select dataset, dimensions, and measures, then click Preview
                    </div>
                )}
                {previewData && (
                    <ChartPreview
                        type={chartType}
                        data={previewData}
                        dimensions={dimensions}
                        measures={measures}
                    />
                )}
            </div>
        </div>
    );
}

export default ChartCreator;