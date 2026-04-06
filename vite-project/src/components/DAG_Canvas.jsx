import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button, Modal, Table, Tag, message, Space, Empty } from "antd";
import { PlusOutlined, SaveOutlined, EditOutlined } from "@ant-design/icons";
import {
    Get_Canvas,
    Save_Canvas,
    Get_Unassigned_Queries,
    Assign_Query_To_DAG,
    Unassign_Query_From_DAG,
} from "../Utils/Local_Store";
import Query_Node from "./Query_Node";

const Node_Types = { query_node: Query_Node };

const Default_Edge_Options = {
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { strokeWidth: 2 },
};

function Canvas_Inner({ DAG_ID }) {
    const Navigate = useNavigate();
    const [Nodes, Set_Nodes, On_Nodes_Change] = useNodesState([]);
    const [Edges, Set_Edges, On_Edges_Change] = useEdgesState([]);
    const [Modal_Open, Set_Modal_Open] = useState(false);
    const [Unassigned, Set_Unassigned] = useState([]);

    const Load_Canvas = useCallback(() => {
        const { Nodes: Raw_Nodes, Edges: Raw_Edges } = Get_Canvas(DAG_ID);

        const Flow_Nodes = Raw_Nodes.map((n) => ({
            id: n.id,
            type: "query_node",
            position: { x: n.position_x, y: n.position_y },
            data: {
                label: n.name,
                Target_Table: n.target_table,
                Mode: n.mode,
                Query_ID: n.id,
                On_Remove: Handle_Remove_Node,
            },
        }));

        const Flow_Edges = Raw_Edges.map((e) => ({
            id: `${e.source}-${e.target}`,
            source: e.source,
            target: e.target,
            ...Default_Edge_Options,
        }));

        Set_Nodes(Flow_Nodes);
        Set_Edges(Flow_Edges);
    }, [DAG_ID]);

    useEffect(() => {
        Load_Canvas();
    }, [Load_Canvas]);

    const On_Connect = useCallback(
        (Connection) => {
            Set_Edges((eds) =>
                addEdge({ ...Connection, ...Default_Edge_Options }, eds)
            );
        },
        []
    );

    const Handle_Save_Canvas = () => {
        const Edge_Data = Edges.map((e) => ({
            source: e.source,
            target: e.target,
        }));

        const Node_Positions = Nodes.map((n) => ({
            query_id: n.id,
            x: n.position.x,
            y: n.position.y,
        }));

        Save_Canvas(DAG_ID, { Edges: Edge_Data, Node_Positions });
        message.success("Canvas saved");
    };

    const Handle_Remove_Node = useCallback(
        (Query_ID) => {
            Unassign_Query_From_DAG(Query_ID);
            Set_Nodes((nds) => nds.filter((n) => n.id !== Query_ID));
            Set_Edges((eds) =>
                eds.filter((e) => e.source !== Query_ID && e.target !== Query_ID)
            );
            message.info("Query removed from DAG");
        },
        []
    );

    const Handle_Open_Add_Modal = () => {
        Set_Unassigned(Get_Unassigned_Queries());
        Set_Modal_Open(true);
    };

    const Handle_Add_Query = (Query) => {
        Assign_Query_To_DAG(Query.id, DAG_ID);

        const New_Node = {
            id: Query.id,
            type: "query_node",
            position: { x: 100 + Nodes.length * 50, y: 100 + Nodes.length * 80 },
            data: {
                label: Query.name,
                Target_Table: Query.target_table,
                Mode: Query.mode,
                Query_ID: Query.id,
                On_Remove: Handle_Remove_Node,
            },
        };

        Set_Nodes((nds) => [...nds, New_Node]);
        Set_Unassigned((prev) => prev.filter((q) => q.id !== Query.id));
        message.success(`Added "${Query.name}"`);
    };

    const Handle_Node_Click = (_event, Node) => {
        // Optional: navigate to query detail on double-click or show drawer
    };

    const Modal_Columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
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
                mode ? <Tag>{mode}</Tag> : "—",
        },
        {
            title: "",
            key: "action",
            width: 80,
            render: (_, record) => (
                <Button size="small" onClick={() => Handle_Add_Query(record)}>
                    Add
                </Button>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <Space>
                    <Button
                        icon={<PlusOutlined />}
                        onClick={Handle_Open_Add_Modal}
                    >
                        Add Query
                    </Button>
                </Space>
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={Handle_Save_Canvas}
                >
                    Save Canvas
                </Button>
            </div>

            <div style={{ height: 500, border: "1px solid #e8e8e8", borderRadius: 8 }}>
                {Nodes.length === 0 ? (
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Empty
                            description="No queries assigned. Click 'Add Query' to start building the pipeline."
                        />
                    </div>
                ) : (
                    <ReactFlow
                        nodes={Nodes}
                        edges={Edges}
                        onNodesChange={On_Nodes_Change}
                        onEdgesChange={On_Edges_Change}
                        onConnect={On_Connect}
                        onNodeClick={Handle_Node_Click}
                        nodeTypes={Node_Types}
                        defaultEdgeOptions={Default_Edge_Options}
                        fitView
                        deleteKeyCode={["Backspace", "Delete"]}
                    >
                        <Controls />
                        <Background gap={16} />
                    </ReactFlow>
                )}
            </div>

            <Modal
                title="Add Query to Pipeline"
                open={Modal_Open}
                onCancel={() => Set_Modal_Open(false)}
                footer={null}
                width={600}
            >
                {Unassigned.length === 0 ? (
                    <Empty description="No unassigned queries. Create a query first from Saved Queries." />
                ) : (
                    <Table
                        columns={Modal_Columns}
                        dataSource={Unassigned}
                        rowKey="id"
                        size="small"
                        pagination={false}
                    />
                )}
            </Modal>
        </div>
    );
}

export default function DAG_Canvas({ DAG_ID }) {
    return (
        <ReactFlowProvider>
            <Canvas_Inner DAG_ID={DAG_ID} />
        </ReactFlowProvider>
    );
}