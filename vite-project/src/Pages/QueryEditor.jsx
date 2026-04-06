import { useState } from "react";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { Run_Query } from "../api/query";
import { Create_Dataset } from "../api/datasets";

function ResultTable({ data, columns }) {
    const table_columns = columns.map((col) => ({
        accessorKey: col,
        header: col,
    }));

    const table = useReactTable({
        data,
        columns: table_columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
                {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                        {hg.headers.map((h) => (
                            <th
                                key={h.id}
                                style={{
                                    padding: "6px 10px",
                                    textAlign: "left",
                                    borderBottom: "2px solid #ddd",
                                    background: "#fafafa",
                                    position: "sticky",
                                    top: 0,
                                    fontWeight: 600,
                                }}
                            >
                                {flexRender(h.column.columnDef.header, h.getContext())}
                            </th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody>
                {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                            <td
                                key={cell.id}
                                style={{ padding: "5px 10px", borderBottom: "1px solid #eee" }}
                            >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function QueryEditor() {
    const [sql, setSql] = useState("SELECT * FROM bi_test.sales LIMIT 20");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Save as dataset state
    const [showSave, setShowSave] = useState(false);
    const [datasetName, setDatasetName] = useState("");
    const [tableName, setTableName] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState(null);

    const handleRun = async () => {
        setLoading(true);
        setError(null);
        setSaveMsg(null);
        try {
            const data = await Run_Query(sql);
            setResult(data);

            // Try to extract table name from SQL for convenience
            const match = sql.match(/FROM\s+(?:\w+\.)?(\w+)/i);
            if (match) setTableName(match[1]);
        } catch (err) {
            setError(err.message);
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDataset = async () => {
        if (!datasetName.trim() || !tableName.trim()) return;
        setSaving(true);
        setSaveMsg(null);
        try {
            const dataset = await Create_Dataset(datasetName, tableName);
            setSaveMsg(`Dataset "${dataset.name}" saved (${dataset.columns.length} columns)`);
            setShowSave(false);
            setDatasetName("");
        } catch (err) {
            setSaveMsg(`Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ display: "flex", gap: 16, height: "calc(100vh - 100px)" }}>
            {/* Left — SQL Editor */}
            <div style={{ width: "40%", display: "flex", flexDirection: "column", gap: 8 }}>
                <h3 style={{ margin: 0 }}>Query Editor</h3>
                <textarea
                    value={sql}
                    onChange={(e) => setSql(e.target.value)}
                    style={{
                        flex: 1,
                        fontFamily: "monospace",
                        fontSize: 14,
                        padding: 12,
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        resize: "none",
                    }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={handleRun}
                        disabled={loading || !sql.trim()}
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
                        {loading ? "Running..." : "Run Query"}
                    </button>
                    {result && (
                        <button
                            onClick={() => setShowSave(!showSave)}
                            style={{
                                padding: "8px 16px",
                                background: "#52c41a",
                                color: "#fff",
                                border: "none",
                                borderRadius: 4,
                                cursor: "pointer",
                                fontWeight: 600,
                            }}
                        >
                            Save as Dataset
                        </button>
                    )}
                </div>

                {/* Save as Dataset form */}
                {showSave && (
                    <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                        <input
                            type="text"
                            placeholder="Dataset name"
                            value={datasetName}
                            onChange={(e) => setDatasetName(e.target.value)}
                            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 4, fontSize: 14 }}
                        />
                        <input
                            type="text"
                            placeholder="Table name (e.g. sales)"
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                            style={{ padding: 8, border: "1px solid #ddd", borderRadius: 4, fontSize: 14 }}
                        />
                        <button
                            onClick={handleSaveDataset}
                            disabled={saving || !datasetName.trim() || !tableName.trim()}
                            style={{
                                padding: "8px 16px",
                                background: saving ? "#ccc" : "#52c41a",
                                color: "#fff",
                                border: "none",
                                borderRadius: 4,
                                cursor: saving ? "default" : "pointer",
                                fontWeight: 600,
                            }}
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                )}

                {result && (
                    <div style={{ fontSize: 12, color: "#888" }}>
                        {result.row_count} rows · {result.execution_time_ms}ms
                    </div>
                )}
                {error && <div style={{ fontSize: 12, color: "red" }}>{error}</div>}
                {saveMsg && <div style={{ fontSize: 12, color: saveMsg.startsWith("Error") ? "red" : "#52c41a" }}>{saveMsg}</div>}
            </div>

            {/* Right — Results */}
            <div style={{ width: "60%", overflow: "auto", border: "1px solid #ddd", borderRadius: 4 }}>
                {!result && !error && (
                    <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>
                        Run a query to see results
                    </div>
                )}
                {result && result.rows.length > 0 && (
                    <ResultTable data={result.rows} columns={result.columns} />
                )}
                {result && result.rows.length === 0 && (
                    <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>
                        Query returned no results
                    </div>
                )}
            </div>
        </div>
    );
}

export default QueryEditor;