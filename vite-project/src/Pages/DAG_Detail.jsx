import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Input, Select, Button, Space, Typography,
    Card, Switch, message, Popconfirm,
} from "antd";
import {
    SaveOutlined, ArrowLeftOutlined, DeleteOutlined,
} from "@ant-design/icons";
import { Get_DAG, Save_DAG, Delete_DAG } from "../Utils/Local_Store";
import DAG_Canvas from "../components/DAG_Canvas";

const { Title, Text } = Typography;
const { TextArea } = Input;

const Cron_Preset_Options = [
    { value: "0 * * * *", label: "Every hour" },
    { value: "0 */6 * * *", label: "Every 6 hours" },
    { value: "0 6 * * *", label: "Daily at 06:00" },
    { value: "0 0 * * *", label: "Daily at midnight" },
    { value: "0 6 * * 1", label: "Weekly Mon 06:00" },
    { value: "custom", label: "Custom" },
];

const Timezone_Options = [
    { value: "Asia/Kolkata", label: "IST (Asia/Kolkata)" },
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "EST (America/New_York)" },
    { value: "America/Los_Angeles", label: "PST (America/Los_Angeles)" },
    { value: "Europe/London", label: "GMT (Europe/London)" },
];

const Default_Form = {
    name: "",
    description: "",
    cron: "0 6 * * *",
    timezone: "Asia/Kolkata",
    is_active: true,
};

export default function DAG_Detail() {
    const { id } = useParams();
    const Navigate = useNavigate();
    const Is_New = !id;

    const [Form, Set_Form] = useState(Default_Form);
    const [Cron_Mode, Set_Cron_Mode] = useState("preset");

    useEffect(() => {
        if (!Is_New) Load_DAG();
    }, [id]);

    const Load_DAG = () => {
        const Data = Get_DAG(id);
        if (Data) {
            Set_Form(Data);
            const Is_Preset = Cron_Preset_Options.some(
                (opt) => opt.value !== "custom" && opt.value === Data.cron
            );
            Set_Cron_Mode(Is_Preset ? "preset" : "custom");
        } else {
            message.error("DAG not found");
            Navigate("/dags");
        }
    };

    const Handle_Change = (Field, Value) => {
        Set_Form((prev) => ({ ...prev, [Field]: Value }));
    };

    const Handle_Cron_Select = (Value) => {
        if (Value === "custom") {
            Set_Cron_Mode("custom");
            Handle_Change("cron", "");
        } else {
            Set_Cron_Mode("preset");
            Handle_Change("cron", Value);
        }
    };

    const Handle_Save = () => {
                if (!Form.name.trim()) return message.warning("Name is required");

        const { edges, ...Config } = Form;
        const Result = Save_DAG(Is_New ? { ...Config } : { ...Config, id });
        if (Result) {
            message.success(Is_New ? "DAG created" : "DAG updated");
            if (Is_New) Navigate(`/dag/${Result.id}`, { replace: true });
        } else {
            message.error("Failed to save DAG");
        }
    };

    const Handle_Delete = () => {
        Delete_DAG(id);
        message.success("DAG deleted");
        Navigate("/dags");
    };

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            {/* ---- Header ---- */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Space>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => Navigate("/dags")}
                    />
                    <Title level={3} style={{ margin: 0 }}>
                        {Is_New ? "New DAG" : Form.name || "Edit DAG"}
                    </Title>
                    {!Is_New && (
                        <Switch
                            checked={Form.is_active}
                            onChange={(val) => Handle_Change("is_active", val)}
                            checkedChildren="Active"
                            unCheckedChildren="Paused"
                        />
                    )}
                </Space>
                <Space>
                    {!Is_New && (
                        <Popconfirm title="Delete this DAG?" onConfirm={Handle_Delete}>
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

            {/* ---- Config Section ---- */}
            <Card title="Configuration" style={{ marginBottom: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={{ gridColumn: "1 / -1" }}>
                        <Text strong>Name</Text>
                        <Input
                            placeholder="e.g. Daily_Analytics_Pipeline"
                            value={Form.name}
                            onChange={(e) => Handle_Change("name", e.target.value)}
                            style={{ marginTop: 4 }}
                        />
                    </div>

                    <div style={{ gridColumn: "1 / -1" }}>
                        <Text strong>Description</Text>
                        <TextArea
                            rows={2}
                            placeholder="What does this DAG do?"
                            value={Form.description}
                            onChange={(e) => Handle_Change("description", e.target.value)}
                            style={{ marginTop: 4 }}
                        />
                    </div>

                    <div>
                        <Text strong>Schedule</Text>
                        <Select
                            options={Cron_Preset_Options}
                            value={Cron_Mode === "custom" ? "custom" : Form.cron}
                            onChange={Handle_Cron_Select}
                            style={{ width: "100%", marginTop: 4 }}
                        />
                        {Cron_Mode === "custom" && (
                            <Input
                                placeholder="e.g. 0 6 * * *"
                                value={Form.cron}
                                onChange={(e) => Handle_Change("cron", e.target.value)}
                                style={{ marginTop: 8, fontFamily: "monospace" }}
                            />
                        )}
                    </div>

                    <div>
                        <Text strong>Timezone</Text>
                        <Select
                            options={Timezone_Options}
                            value={Form.timezone}
                            onChange={(val) => Handle_Change("timezone", val)}
                            style={{ width: "100%", marginTop: 4 }}
                        />
                    </div>
                </div>
            </Card>

            {/* ---- Canvas Section ---- */}
            {!Is_New && (
                <Card title="Query Pipeline" style={{ marginBottom: 16 }}>
                    <DAG_Canvas DAG_ID={id} />
                </Card>
            )}
        </div>
    );
}