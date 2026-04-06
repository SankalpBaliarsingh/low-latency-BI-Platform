/**
 * useTelemetry.js
 *
 * React hook that:
 * 1. Allocates SharedArrayBuffer ring buffers
 * 2. Spawns the Web Worker
 * 3. Sends INIT with SAB to worker
 * 4. Exposes read views + connection status to components
 *
 * Usage:
 *   const { Status, Catalog, Read_Views, Capacity } = useTelemetry(WS_Url);
 */

import { useState, useEffect, useRef } from "react";
import { Calc_SAB_Size, Create_Read_View } from "./Ring_Buffer.js";

/** Default ring buffer capacity per param — power of 2, ~5 min at 5 Hz */
const DEFAULT_CAPACITY = 2048;

/** Known param IDs for initial SAB allocation (matches mock server) */
const INITIAL_PARAM_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const useTelemetry = (WS_Url) => {
    const [Status, Set_Status] = useState("idle");
    const [Catalog, Set_Catalog] = useState(null);

    const Worker_Ref = useRef(null);
    const SAB_Ref = useRef(null);
    const Read_Views_Ref = useRef({});
    const Capacity_Ref = useRef(DEFAULT_CAPACITY);

    useEffect(() => {
        const Num_Params = INITIAL_PARAM_IDS.length;
        const Capacity = DEFAULT_CAPACITY;

        // Build Param_Id → Index mapping (index into SAB slots)
        const Param_Id_To_Index = {};
        INITIAL_PARAM_IDS.forEach((Id, Idx) => {
            Param_Id_To_Index[Id] = Idx;
        });

        // Allocate SharedArrayBuffer
        const SAB_Size = Calc_SAB_Size(Num_Params, Capacity);
        const SAB = new SharedArrayBuffer(SAB_Size);
        SAB_Ref.current = SAB;
        Capacity_Ref.current = Capacity;

        // Create read views for main thread
        const Views = {};
        INITIAL_PARAM_IDS.forEach((Id, Idx) => {
            Views[Id] = Create_Read_View(SAB, Idx, Capacity);
        });
        Read_Views_Ref.current = Views;

        // Spawn worker (Vite handles the URL transform)
        const W = new Worker(
            new URL("./Telemetry_Worker.js", import.meta.url),
            { type: "module" }
        );
        Worker_Ref.current = W;

        // Listen for worker messages
        W.onmessage = (Event) => {
            const Msg = Event.data;

            if (Msg.Type === "STATUS") {
                Set_Status(Msg.Status);
            }
            if (Msg.Type === "CATALOG") {
                Set_Catalog(Msg.Params);
            }
            if (Msg.Type === "ERROR") {
                console.error("[Telemetry]", Msg.Message);
                Set_Status("error");
            }
        };

        // Send INIT with SAB to worker
        W.postMessage({
            Type: "INIT",
            SAB,
            Capacity,
            WS_Url,
            Param_Id_To_Index,
        });

        // Cleanup on unmount
        return () => {
            W.postMessage({ Type: "DISCONNECT" });
            W.terminate();
            Worker_Ref.current = null;
        };
    }, [WS_Url]);

    return {
        Status,
        Catalog,
        Read_Views: Read_Views_Ref.current,
        Capacity: Capacity_Ref.current,
    };
};

export default useTelemetry;