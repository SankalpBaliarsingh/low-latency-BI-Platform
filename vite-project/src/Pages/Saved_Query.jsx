import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Input, Select, InputNumber, Button, Space, Typography,
    Card, Table, message, Popconfirm,
} from "antd";
import {
    SaveOutlined, PlayCircleOutlined, ArrowLeftOutlined, DeleteOutlined,
} from "@ant-design/icons";
import { Get_Saved_Query, Save_Query, Delete_Query, Get_DAGs } from "../Utils/Local_Store";

const { Title, Text } = Typography;
const { TextArea } = Input;

const Mode_Options = [
    { value: "truncate_reload", label: "Truncate & Reload" },
    { value: "append", label: "Append" },
];

const Default_Form = {
    name: "",
    sql: "",
    target_table: "",
    mode: "truncate_reload",
    timeout_seconds: 300,
    retries: 1,
    dag_id: null,
};

export default function Saved_Query() {
    const { id } = useParams();
    const Navigate = useNavigate();
    const Is_New = !id;

    const [Form, Set_Form] = useState(Default_Form);
    const [DAG_Options, Set_DAG_Options] = useState([]);
    const [Preview_Data, Set_Preview_Data] = useState(null);
    const [Preview_Columns, Set_Preview_Columns] = useState([]);
    const [Running, Set_Running] = useState(false);

    useEffect(() => {
        Load_DAGs();
        if (!Is_New) Load_Query();
    }, [id]);

    const Load_Query = () => {
        const Data = Get_Saved_Query(id);
        if (Data) {
            Set_Form(Data);
        } else {
            message.error("Query not found");
            Navigate("/saved-queries");
        }
    };

    const Load_DAGs = () => {
        const All_DAGs = Get_DAGs();
        Set_DAG_Options(All_DAGs.map((d) => ({ value: d.id, label: d.name })));
    };

    const Handle_Change = (Field, Value) => {
        Set_Form((prev) => ({ ...prev, [Field]: Value }));
    };

    const Handle_Save = () => {
        if (!Form.name.trim()) return message.warning("Name is required");
        if (!Form.sql.trim()) return message.warning("SQL is required");

        const Result = Save_Query(Is_New ? { ...Form } : { ...Form, id });
        if (Result) {
            message.success(Is_New ? "Query created" : "Query updated");
            if (Is_New) Navigate(`/saved-query/${Result.id}`, { replace: true });
        } else {
            message.error("Failed to save query");
        }
    };

    const Handle_Run = async () => {
        if (!Form.sql.trim()) return message.warning("Write a query first");

        Set_Running(true);
        Set_Preview_Data(null);
        try {
            const Response = await fetch("/api/query/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sql: Form.sql }),
            });
            const Data = await Response.json();

            if (Data.columns && Data.rows) {
                Set_Preview_Columns(
                    Data.columns.map((col) => ({
                        title: col,
                        dataIndex: col,
                        key: col,
                        ellipsis: true,
                    }))
                );
                Set_Preview_Data(Data.rows);
            }
        } catch (Err) {
            message.error("Query execution failed");
        } finally {
            Set_Running(false);
        }
    };

    const Handle_Delete = () => {
        Delete_Query(id);
        message.success("Query deleted");
        Navigate("/saved-queries");
    };

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Space>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => Navigate("/saved-queries")}
                    />
                    <Title level={3} style={{ margin: 0 }}>
                        {Is_New ? "New Query" : Form.name || "Edit Query"}
                    </Title>
                </Space>
                <Space>
                    {!Is_New && (
                        <Popconfirm title="Delete this query?" onConfirm={Handle_Delete}>
                            <Button danger icon={<DeleteOutlined />}>Delete</Button>
                        </Popconfirm>
                    )}
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={Handle_Save}
                    >
                        Save
                    </Button>
                </Space>
            </div>

            {/* ---- Query Section ---- */}
            <Card title="Query" style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 12 }}>
                    <Text strong>Name</Text>
                    <Input
                        placeholder="e.g. Daily_Active_Users"
                        value={Form.name}
                        onChange={(e) => Handle_Change("name", e.target.value)}
                        style={{ marginTop: 4 }}
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <Text strong>SQL</Text>
                    {/* Replace with CodeMirror/Monaco if available */}
                    <TextArea
                        rows={10}
                        placeholder="SELECT ..."
                        value={Form.sql}
                        onChange={(e) => Handle_Change("sql", e.target.value)}
                        style={{
                            marginTop: 4,
                            fontFamily: "'Fira Code', 'Consolas', monospace",
                            fontSize: 13,
                        }}
                    />
                </div>

                <Button
                    icon={<PlayCircleOutlined />}
                    loading={Running}
                    onClick={Handle_Run}
                >
                    Run Preview
                </Button>

                {Preview_Data && (
                    <div style={{ marginTop: 16 }}>
                        <Text type="secondary">{Preview_Data.length} rows returned</Text>
                        <Table
                            columns={Preview_Columns}
                            dataSource={Preview_Data}
                            rowKey={(_, i) => i}
                            size="small"
                            scroll={{ x: true }}
                            pagination={{ pageSize: 10, showSizeChanger: false }}
                            style={{ marginTop: 8 }}
                        />
                    </div>
                )}
            </Card>

            {/* ---- DAG Configuration Section ---- */}
            <Card title="DAG Configuration">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                        <Text strong>Target Table</Text>
                        <Input
                            placeholder="e.g. analytics.daily_active_users"
                            value={Form.target_table}
                            onChange={(e) => Handle_Change("target_table", e.target.value)}
                            style={{ marginTop: 4 }}
                        />
                    </div>

                    <div>
                        <Text strong>Mode</Text>
                        <Select
                            options={Mode_Options}
                            value={Form.mode}
                            onChange={(val) => Handle_Change("mode", val)}
                            style={{ width: "100%", marginTop: 4 }}
                        />
                    </div>

                    <div>
                        <Text strong>Timeout (seconds)</Text>
                        <InputNumber
                            min={10}
                            max={3600}
                            value={Form.timeout_seconds}
                            onChange={(val) => Handle_Change("timeout_seconds", val)}
                            style={{ width: "100%", marginTop: 4 }}
                        />
                    </div>

                    <div>
                        <Text strong>Retries on Failure</Text>
                        <InputNumber
                            min={0}
                            max={5}
                            value={Form.retries}
                            onChange={(val) => Handle_Change("retries", val)}
                            style={{ width: "100%", marginTop: 4 }}
                        />
                    </div>

                    <div>
                        <Text strong>Assign to DAG</Text>
                        <Select
                            options={DAG_Options}
                            value={Form.dag_id}
                            onChange={(val) => Handle_Change("dag_id", val)}
                            placeholder="None (standalone)"
                            allowClear
                            style={{ width: "100%", marginTop: 4 }}
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
}