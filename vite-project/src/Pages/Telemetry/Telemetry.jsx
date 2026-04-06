/**
 * Telemetry.jsx
 *
 * Main telemetry page. Connects to mock data node, displays live param values.
 * Phase 1 — validates full pipeline: WS → Worker → SAB → RAF → DOM
 */

import Connection_Status from "./Connection_Status";
import Param_Monitor from "./Param_Monitor";
import useTelemetry from "./useTelemetry";

const WS_URL = "ws://localhost:4000/ws/telemetry";

const Styles = {
    Header: {
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 20,
    },
    Title: {
        fontSize: 18,
        fontWeight: 600,
        margin: 0,
    },
};

const Telemetry = () => {
    const { Status, Catalog, Read_Views, Capacity } = useTelemetry(WS_URL);

    return (
        <div>
            <div style={Styles.Header}>
                <h2 style={Styles.Title}>Telemetry Monitor</h2>
                <Connection_Status Status={Status} />
                {Catalog && (
                    <span style={{ color: "#888", fontSize: 13 }}>
                        {Catalog.length} params &middot; buffer: {Capacity} samples
                    </span>
                )}
            </div>

            <Param_Monitor Catalog={Catalog} Read_Views={Read_Views} />
        </div>
    );
};

export default Telemetry;