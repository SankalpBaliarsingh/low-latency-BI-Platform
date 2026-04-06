import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Input, Button, Tag, Typography } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Get_DAGs } from "../Utils/Local_Store";

const { Title } = Typography;

const Cron_Presets = {
    "0 * * * *": "Every hour",
    "0 */6 * * *": "Every 6 hours",
    "0 6 * * *": "Daily at 06:00",
    "0 0 * * *": "Daily at midnight",
    "0 6 * * 1": "Weekly Mon 06:00",
};

const Columns = [
    {
        title: "Name",
        dataIndex: "name",
        key: "name",
        sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
        title: "Description",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
        render: (text) => text || "—",
    },
    {
        title: "Schedule",
        dataIndex: "cron",
        key: "cron",
        render: (cron) => {
            if (!cron) return <Tag>Manual</Tag>;
            const Label = Cron_Presets[cron] || cron;
            return <Tag color="blue">{Label}</Tag>;
        },
    },
    {
        title: "Queries",
        dataIndex: "query_count",
        key: "query_count",
        sorter: (a, b) => a.query_count - b.query_count,
        render: (count) => count || 0,
    },
    {
        title: "Active",
        dataIndex: "is_active",
        key: "is_active",
        render: (val) => (
            <Tag color={val ? "green" : "default"}>{val ? "Active" : "Paused"}</Tag>
        ),
    },
    {
        title: "Last Modified",
        dataIndex: "updated_at",
        key: "updated_at",
        sorter: (a, b) => new Date(a.updated_at) - new Date(b.updated_at),
        defaultSortOrder: "descend",
        render: (text) => (text ? new Date(text).toLocaleString() : "—"),
    },
];

export default function DAG_List() {
    const Navigate = useNavigate();
    const [DAGs, Set_DAGs] = useState([]);
    const [Search_Text, Set_Search_Text] = useState("");

    useEffect(() => {
        Set_DAGs(Get_DAGs());
    }, []);

    const Filtered_DAGs = DAGs.filter((d) =>
        d.name.toLowerCase().includes(Search_Text.toLowerCase()) ||
        (d.description || "").toLowerCase().includes(Search_Text.toLowerCase())
    );

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0 }}>DAGs</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => Navigate("/dag/new")}
                >
                    New DAG
                </Button>
            </div>

            <Input
                placeholder="Search by name or description..."
                prefix={<SearchOutlined />}
                value={Search_Text}
                onChange={(e) => Set_Search_Text(e.target.value)}
                style={{ marginBottom: 16, maxWidth: 400 }}
                allowClear
            />

            <Table
                columns={Columns}
                dataSource={Filtered_DAGs}
                rowKey="id"
                onRow={(record) => ({
                    onClick: () => Navigate(`/dag/${record.id}`),
                    style: { cursor: "pointer" },
                })}
                pagination={{ pageSize: 15, showSizeChanger: false }}
            />
        </div>
    );
}