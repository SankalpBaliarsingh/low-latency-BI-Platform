import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Input, Button, Tag, Typography } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Get_Saved_Queries, Get_DAGs } from "../Utils/Local_Store";

const { Title } = Typography;

const Mode_Colors = {
    truncate_reload: "volcano",
    append: "blue",
};

const Columns = [
    {
        title: "Name",
        dataIndex: "name",
        key: "name",
        sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
        title: "Target Table",
        dataIndex: "target_table",
        key: "target_table",
        render: (text) => text || "—",
    },
    {
        title: "Mode",
        dataIndex: "mode",
        key: "mode",
        render: (mode) =>
            mode ? <Tag color={Mode_Colors[mode] || "default"}>{mode}</Tag> : "—",
    },
    {
        title: "DAG",
        dataIndex: "dag_name",
        key: "dag_name",
        render: (text) => text || "—",
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

export default function Saved_Queries() {
    const Navigate = useNavigate();
    const [Queries, Set_Queries] = useState([]);
    const [Search_Text, Set_Search_Text] = useState("");

    useEffect(() => {
        Load_Queries();
    }, []);

    const Load_Queries = () => {
        const All_Queries = Get_Saved_Queries();
        const All_DAGs = Get_DAGs();
        const DAG_Map = Object.fromEntries(All_DAGs.map((d) => [d.id, d.name]));

        const With_DAG_Names = All_Queries.map((q) => ({
            ...q,
            dag_name: q.dag_id ? DAG_Map[q.dag_id] || "Unknown" : null,
        }));

        Set_Queries(With_DAG_Names);
    };

    const Filtered_Queries = Queries.filter((q) =>
        q.name.toLowerCase().includes(Search_Text.toLowerCase()) ||
        (q.target_table || "").toLowerCase().includes(Search_Text.toLowerCase())
    );

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0 }}>Saved Queries</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => Navigate("/saved-query/new")}
                >
                    New Query
                </Button>
            </div>

            <Input
                placeholder="Search by name or target table..."
                prefix={<SearchOutlined />}
                value={Search_Text}
                onChange={(e) => Set_Search_Text(e.target.value)}
                style={{ marginBottom: 16, maxWidth: 400 }}
                allowClear
            />

            <Table
                columns={Columns}
                dataSource={Filtered_Queries}
                rowKey="id"
                onRow={(record) => ({
                    onClick: () => Navigate(`/saved-query/${record.id}`),
                    style: { cursor: "pointer" },
                })}
                pagination={{ pageSize: 15, showSizeChanger: false }}
            />
        </div>
    );
}