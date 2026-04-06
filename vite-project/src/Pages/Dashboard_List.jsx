import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Button, Tag, Spin } from "antd";
import { PlusOutlined, DashboardOutlined } from "@ant-design/icons";
import { Fetch_Dashboards } from "../api/dashboards";

function Dashboard_List() {
    const navigate = useNavigate();
    const [dashboards, setDashboards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        Fetch_Dashboards()
            .then(setDashboards)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
    if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ margin: 0 }}>Dashboards</h2>
                <Button type="primary" icon={<PlusOutlined />}>New Dashboard</Button>
            </div>

            <Row gutter={[16, 16]}>
                {dashboards.map((d) => (
                    <Col key={d.id} xs={24} sm={12} lg={8} xl={6}>
                        <Card hoverable onClick={() => navigate(`/dashboard/${d.id}`)} style={{ height: "100%" }}>
                            <div style={{ fontSize: 40, textAlign: "center", color: "#1677ff", marginBottom: 12 }}>
                                <DashboardOutlined />
                            </div>
                            <Card.Meta title={d.title} description={d.description} />
                            <div style={{ marginTop: 12 }}>
                                {(d.tags || []).map((t) => <Tag key={t}>{t}</Tag>)}
                            </div>
                            <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
                                {d.owner_id} · {d.modified_at?.split("T")[0]}
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
}

export default Dashboard_List;