import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Tag, Typography } from "antd";
import { CloseOutlined } from "@ant-design/icons";

const { Text } = Typography;

const Mode_Colors = {
    truncate_reload: "volcano",
    append: "blue",
};

const Styles = {
    Node: {
        padding: "10px 14px",
        border: "1px solid #d9d9d9",
        borderRadius: 8,
        background: "#fff",
        minWidth: 180,
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        position: "relative",
    },
    Remove: {
        position: "absolute",
        top: 4,
        right: 6,
        cursor: "pointer",
        fontSize: 10,
        color: "#999",
        padding: 4,
    },
    Name: {
        fontWeight: 600,
        fontSize: 13,
        marginBottom: 4,
        paddingRight: 16,
    },
    Target: {
        fontSize: 11,
        color: "#888",
        marginBottom: 4,
    },
};

function Query_Node({ data }) {
    return (
        <div style={Styles.Node}>
            <Handle type="target" position={Position.Top} />

            <div
                style={Styles.Remove}
                onClick={(e) => {
                    e.stopPropagation();
                    data.On_Remove?.(data.Query_ID);
                }}
                title="Remove from DAG"
            >
                <CloseOutlined />
            </div>

            <div style={Styles.Name}>{data.label}</div>
            {data.Target_Table && (
                <div style={Styles.Target}>{data.Target_Table}</div>
            )}
            {data.Mode && (
                <Tag color={Mode_Colors[data.Mode] || "default"} style={{ fontSize: 11 }}>
                    {data.Mode}
                </Tag>
            )}

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}

export default memo(Query_Node);