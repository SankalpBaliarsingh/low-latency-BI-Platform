/**
 * Param_Monitor.jsx
 *
 * Reads latest values from ring buffers using requestAnimationFrame.
 * Displays a live table of all params — this validates the full pipeline
 * (WS → Worker → SAB → main thread read) before we add real charts.
 *
 * IMPORTANT: RAF drives the data reads, NOT React state per frame.
 * We batch DOM updates via refs to avoid 60fps re-renders.
 */

import { useEffect, useRef } from "react";
import { Read_Latest_Value } from "./Ring_Buffer.js";

const Styles = {
    Table: {
        fontFamily: "monospace",
        fontSize: 13,
        borderCollapse: "collapse",
        width: "100%",
        maxWidth: 700,
    },
    Th: {
        textAlign: "left",
        padding: "6px 12px",
        borderBottom: "2px solid #333",
        color: "#999",
    },
    Td: {
        padding: "4px 12px",
        borderBottom: "1px solid #222",
    },
    Value: {
        color: "#4fc3f7",
        minWidth: 100,
        textAlign: "right",
    },
    Timestamp: {
        color: "#888",
        minWidth: 110,
    },
    Count: {
        color: "#666",
        minWidth: 70,
        textAlign: "right",
    },
    Rate: {
        color: "#666",
        minWidth: 60,
        textAlign: "right",
    },
};

/** Format IRIG timestamp (seconds since midnight) as HH:MM:SS.mmm */
const Format_IRIG = (Secs) => {
    if (Secs === 0) return "--:--:--.---";
    const H = Math.floor(Secs / 3600);
    const M = Math.floor((Secs % 3600) / 60);
    const S = Secs % 60;
    return `${String(H).padStart(2, "0")}:${String(M).padStart(2, "0")}:${S.toFixed(3).padStart(6, "0")}`;
};

const Param_Monitor = ({ Catalog, Read_Views }) => {
    const Table_Body_Ref = useRef(null);
    const Prev_Counts_Ref = useRef({});
    const Rate_Accum_Ref = useRef({});   // for computing actual sample rate
    const Last_Rate_Time_Ref = useRef(performance.now());

    useEffect(() => {
        if (!Catalog || !Read_Views) return;

        let RAF_Id;

        const Update = () => {
            const Body = Table_Body_Ref.current;
            if (!Body) {
                RAF_Id = requestAnimationFrame(Update);
                return;
            }

            const Rows = Body.children;
            const Now = performance.now();
            const Dt = Now - Last_Rate_Time_Ref.current;

            // Update rate calculation every second
            const Calc_Rate = Dt >= 1000;
            if (Calc_Rate) Last_Rate_Time_Ref.current = Now;

            for (let i = 0; i < Catalog.length; i++) {
                const Param = Catalog[i];
                const View = Read_Views[Param.Param_Id];
                if (!View) continue;

                const Latest = Read_Latest_Value(View);
                const Row = Rows[i];
                if (!Row) continue;

                const Cells = Row.children;

                if (Latest) {
                    Cells[2].textContent = Latest.Value.toFixed(4);
                    Cells[3].textContent = Format_IRIG(Latest.Timestamp);
                    Cells[4].textContent = Latest.Sample_Count;

                    // Compute actual receive rate
                    const Prev = Prev_Counts_Ref.current[Param.Param_Id] || 0;
                    const Delta = Latest.Sample_Count - Prev;

                    if (!Rate_Accum_Ref.current[Param.Param_Id]) {
                        Rate_Accum_Ref.current[Param.Param_Id] = 0;
                    }
                    Rate_Accum_Ref.current[Param.Param_Id] += Delta;

                    if (Calc_Rate) {
                        const Rate = Rate_Accum_Ref.current[Param.Param_Id] / (Dt / 1000);
                        Cells[5].textContent = Rate.toFixed(1);
                        Rate_Accum_Ref.current[Param.Param_Id] = 0;
                        Prev_Counts_Ref.current[Param.Param_Id] = Latest.Sample_Count;
                    }
                }
            }

            RAF_Id = requestAnimationFrame(Update);
        };

        RAF_Id = requestAnimationFrame(Update);
        return () => cancelAnimationFrame(RAF_Id);
    }, [Catalog, Read_Views]);

    if (!Catalog) return null;

    return (
        <table style={Styles.Table}>
            <thead>
                <tr>
                    <th style={Styles.Th}>ID</th>
                    <th style={Styles.Th}>Param</th>
                    <th style={{ ...Styles.Th, textAlign: "right" }}>Value</th>
                    <th style={Styles.Th}>Timestamp</th>
                    <th style={{ ...Styles.Th, textAlign: "right" }}>Samples</th>
                    <th style={{ ...Styles.Th, textAlign: "right" }}>Hz</th>
                </tr>
            </thead>
            <tbody ref={Table_Body_Ref}>
                {Catalog.map((P) => (
                    <tr key={P.Param_Id}>
                        <td style={Styles.Td}>{P.Param_Id}</td>
                        <td style={Styles.Td}>
                            {P.Name} <span style={{ color: "#666" }}>({P.Unit})</span>
                        </td>
                        <td style={{ ...Styles.Td, ...Styles.Value }}>--</td>
                        <td style={{ ...Styles.Td, ...Styles.Timestamp }}>--:--:--.---</td>
                        <td style={{ ...Styles.Td, ...Styles.Count }}>0</td>
                        <td style={{ ...Styles.Td, ...Styles.Rate }}>--</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default Param_Monitor;