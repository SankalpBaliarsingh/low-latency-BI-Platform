import { Card } from "antd";
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
    useReactTable, getCoreRowModel, flexRender
} from "@tanstack/react-table";

const COLORS = ["#1677ff", "#52c41a", "#faad14", "#f5222d", "#722ed1", "#13c2c2", "#eb2f96"];

function BarChartView({ data, config }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={config.x_axis} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {config.measures.map((m, i) => (
                    <Bar key={m} dataKey={m} fill={COLORS[i % COLORS.length]} />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}

function LineChartView({ data, config }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={config.x_axis} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {config.measures.map((m, i) => (
                    <Line key={m} type="monotone" dataKey={m} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}

function PieChartView({ data, config }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    dataKey={config.measures[0]}
                    nameKey={config.x_axis}
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

function TableView({ data, config }) {
    const columns = config.columns.map((col) => ({
        accessorKey: col,
        header: col,
        cell: (info) => info.getValue(),
    }));

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div style={{ overflow: "auto", height: "100%", fontSize: 13 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    {table.getHeaderGroups().map((hg) => (
                        <tr key={hg.id}>
                            {hg.headers.map((h) => (
                                <th
                                    key={h.id}
                                    style={{
                                        padding: "6px 10px", textAlign: "left",
                                        borderBottom: "2px solid #f0f0f0", background: "#fafafa",
                                        position: "sticky", top: 0, fontWeight: 600,
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
                                    style={{ padding: "5px 10px", borderBottom: "1px solid #f0f0f0" }}
                                >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ChartCard({ chart, data }) {
    const renderChart = () => {
        switch (chart.type) {
            case "bar":
                return <BarChartView data={data} config={chart.config} />;
            case "line":
                return <LineChartView data={data} config={chart.config} />;
            case "pie":
                return <PieChartView data={data} config={chart.config} />;
            case "table":
                return <TableView data={data} config={chart.config} />;
            default:
                return <div style={{ color: "#bbb" }}>Unknown chart type: {chart.type}</div>;
        }
    };

    return (
        <Card
            title={chart.title}
            extra={<span style={{ color: "#888", fontSize: 12, textTransform: "capitalize" }}>{chart.type}</span>}
            style={{ height: "100%", overflow: "hidden" }}
            styles={{ body: { padding: 12, height: "calc(100% - 46px)" } }}
        >
            {renderChart()}
        </Card>
    );
}

export default ChartCard;