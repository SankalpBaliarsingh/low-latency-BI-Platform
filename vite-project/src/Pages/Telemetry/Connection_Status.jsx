/**
 * Connection_Status.jsx
 *
 * Displays WebSocket connection state as a colored badge.
 */

import { Tag } from "antd";

const STATUS_CONFIG = {
    idle:          { color: "default",    label: "Idle" },
    connecting:    { color: "processing", label: "Connecting..." },
    connected:     { color: "success",    label: "Connected" },
    disconnected:  { color: "warning",    label: "Disconnected" },
    error:         { color: "error",      label: "Error" },
};

const Connection_Status = ({ Status }) => {
    const Config = STATUS_CONFIG[Status] || STATUS_CONFIG.idle;
    return <Tag color={Config.color}>{Config.label}</Tag>;
};

export default Connection_Status;