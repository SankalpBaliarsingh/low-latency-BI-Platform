/**
 * Telemetry_Worker.js
 *
 * Web Worker that:
 * 1. Receives SAB + config from main thread
 * 2. Opens WebSocket to data node
 * 3. Decodes binary frames (DataView)
 * 4. Writes samples into SharedArrayBuffer ring buffers
 *
 * Communication with main thread:
 *   Main → Worker:  { Type: "INIT", SAB, Capacity, WS_Url, Param_Id_To_Index }
 *   Worker → Main:  { Type: "STATUS", Status: "connecting"|"connected"|"disconnected" }
 *   Worker → Main:  { Type: "CATALOG", Params: [...] }
 *   Worker → Main:  { Type: "ERROR", Message: "..." }
 */

import { Create_Write_View, Write_Sample } from "./Ring_Buffer.js";

const BYTES_PER_SAMPLE = 18; // uint16 + float64 + float64

let WS = null;
let Write_Views = {};  // Param_Id → Write_View
let Frame_Count = 0;

/**
 * Decode a binary frame and write samples to ring buffers.
 * @param {ArrayBuffer} Data
 */
const Handle_Binary_Frame = (Data) => {
    const DV = new DataView(Data);
    const Num_Samples = DV.getUint16(0, false); // big-endian

    let Offset = 2; // skip header
    for (let i = 0; i < Num_Samples; i++) {
        const Param_Id  = DV.getUint16(Offset, false);
        const Timestamp = DV.getFloat64(Offset + 2, false);
        const Value     = DV.getFloat64(Offset + 10, false);

        const View = Write_Views[Param_Id];
        if (View) {
            Write_Sample(View, Timestamp, Value);
        }

        Offset += BYTES_PER_SAMPLE;
    }

    Frame_Count++;
};

/**
 * Handle messages from main thread.
 */
self.onmessage = (Event) => {
    const Msg = Event.data;

    if (Msg.Type === "INIT") {
        const { SAB, Capacity, WS_Url, Param_Id_To_Index } = Msg;

        // Create write views for each param
        for (const [Param_Id_Str, Index] of Object.entries(Param_Id_To_Index)) {
            const Param_Id = Number(Param_Id_Str);
            Write_Views[Param_Id] = Create_Write_View(SAB, Index, Capacity);
        }

        // Open WebSocket
        self.postMessage({ Type: "STATUS", Status: "connecting" });

        WS = new WebSocket(WS_Url);
        WS.binaryType = "arraybuffer";

        WS.onopen = () => {
            self.postMessage({ Type: "STATUS", Status: "connected" });
        };

        WS.onmessage = (WS_Event) => {
            const Data = WS_Event.data;

            // First message is JSON handshake (string), rest are binary (ArrayBuffer)
            if (typeof Data === "string") {
                const Parsed = JSON.parse(Data);
                if (Parsed.Type === "PARAM_CATALOG") {
                    self.postMessage({ Type: "CATALOG", Params: Parsed.Params });
                }
                return;
            }

            // Binary frame
            Handle_Binary_Frame(Data);
        };

        WS.onclose = () => {
            self.postMessage({ Type: "STATUS", Status: "disconnected" });
        };

        WS.onerror = () => {
            self.postMessage({ Type: "ERROR", Message: "WebSocket connection failed" });
        };
    }

    if (Msg.Type === "DISCONNECT") {
        if (WS) {
            WS.close();
            WS = null;
        }
    }
};