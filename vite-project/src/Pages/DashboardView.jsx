import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, Button, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Responsive, useContainerWidth } from "react-grid-layout";
import { Fetch_Dashboard, Fetch_Chart_Data } from "../api/dashboards";
import ChartCard from "../components/ChartCard";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

function DashboardView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { width, containerRef, mounted } = useContainerWidth();

    const [dashboard, setDashboard] = useState(null);
    const [chartData, setChartData] = useState({});
    const [activeTab, setActiveTab] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch dashboard config
    useEffect(() => {
        Fetch_Dashboard(id)
            .then((data) => {
                setDashboard(data);
                setActiveTab(data.tabs[0]?.key || "");
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    // Fetch data for all charts once dashboard is loaded
    useEffect(() => {
        if (!dashboard) return;

        const chart_ids = [];
        for (const tab of dashboard.tabs) {
            for (const item of tab.layout) {
                if (!chart_ids.includes(item.i)) {
                    chart_ids.push(item.i);
                }
            }
        }

        chart_ids.forEach((chart_id) => {
            Fetch_Chart_Data(chart_id)
                .then((data) => {
                    setChartData((prev) => ({ ...prev, [chart_id]: data }));
                })
                .catch((err) => {
                    console.error(`Failed to fetch chart ${chart_id}:`, err);
                });
        });
    }, [dashboard]);

    if (loading) return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
    if (error) return <div style={{ color: "red" }}>Error: {error}</div>;
    if (!dashboard) return <div>Dashboard not found</div>;

    const currentTab = dashboard.tabs.find((t) => t.key === activeTab);
    const tabItems = dashboard.tabs.map((tab) => ({
        key: tab.key,
        label: tab.label,
    }));

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/dashboards")} />
                <h2 style={{ margin: 0 }}>{dashboard.title}</h2>
            </div>

            <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

            <div ref={containerRef}>
                {mounted && currentTab && (
                    <Responsive
                        width={width}
                        layouts={{ lg: currentTab.layout }}
                        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                        rowHeight={60}
                        isDraggable={false}
                        isResizable={false}
                    >
                        {currentTab.layout.map((item) => {
                            const chart_config = dashboard.charts?.[item.i];
                            const data = chartData[item.i];

                            const chart = chart_config
                                ? {
                                    title: chart_config.name,
                                    type: chart_config.type,
                                    config: {
                                        x_axis: chart_config.config.dimensions?.[0],
                                        measures: chart_config.config.measures?.map((m) => m.column),
                                        columns: chart_config.config.dimensions.concat(
                                            chart_config.config.measures.map((m) => m.column)
                                        ),
                                    },
                                }
                                : { title: "Loading...", type: "table", config: {} };

                            return (
                                <div key={item.i}>
                                    <ChartCard
                                        chart={chart}
                                        data={data?.rows || []}
                                    />
                                </div>
                            );
                        })}
                    </Responsive>
                )}
            </div>
        </div>
    );
}

export default DashboardView;