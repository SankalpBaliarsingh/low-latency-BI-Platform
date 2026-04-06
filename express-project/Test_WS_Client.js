/**
 * Test_WS_Client.js
 *
 * Standalone test — run with: node Test_WS_Client.js
 * Connects to the mock data node, decodes binary frames, logs samples.
 * Validates the exact same decode logic the browser Web Worker will use.
 *
 * Also tracks frame rate and sample throughput for performance baseline.
 */

const WebSocket = require("ws");

const WS_URL = process.env.WS_URL || "ws://localhost:4000/ws/telemetry";
const BYTES_PER_SAMPLE = 18; // uint16 + float64 + float64

let Param_Catalog = null;
let Frame_Count = 0;
let Sample_Count = 0;
let Stats_Start = Date.now();

/** Decode a binary frame — mirrors what the browser worker will do */
const Decode_Frame = (Data) => {
    const Buf = Buffer.from(Data);
    const Num_Samples = Buf.readUInt16BE(0);

    const Samples = [];
    let Offset = 2; // skip header

    for (let i = 0; i < Num_Samples; i++) {
        const Param_Id  = Buf.readUInt16BE(Offset);
        const Timestamp = Buf.readDoubleBE(Offset + 2);
        const Value     = Buf.readDoubleBE(Offset + 10);

        Samples.push({ Param_Id, Timestamp, Value });
        Offset += BYTES_PER_SAMPLE;
    }

    return Samples;
};

/** Format IRIG timestamp (seconds since midnight) as HH:MM:SS.mmm */
const Format_IRIG = (Secs) => {
    const H = Math.floor(Secs / 3600);
    const M = Math.floor((Secs % 3600) / 60);
    const S = Secs % 60;
    return `${String(H).padStart(2, "0")}:${String(M).padStart(2, "0")}:${S.toFixed(3).padStart(6, "0")}`;
};

/** Lookup param name from catalog */
const Param_Name = (Id) => {
    if (!Param_Catalog) return `P${Id}`;
    const P = Param_Catalog.find((p) => p.Param_Id === Id);
    return P ? `${P.Name}(${P.Unit})` : `P${Id}`;
};

// --- Connect ---
console.log(`Connecting to ${WS_URL} ...`);
const WS = new WebSocket(WS_URL);

WS.on("open", () => {
    console.log("Connected. Waiting for handshake...\n");
});

WS.on("message", (Data, Is_Binary) => {
    // First message is JSON handshake
    if (!Is_Binary) {
        const Msg = JSON.parse(Data.toString());
        if (Msg.Type === "PARAM_CATALOG") {
            Param_Catalog = Msg.Params;
            console.log("Param catalog received:");
            Param_Catalog.forEach((p) =>
                console.log(`  [${p.Param_Id}] ${p.Name.padEnd(6)} ${p.Unit.padEnd(6)} ${p.Rate_Hz}Hz  range: ${p.Min}..${p.Max}`)
            );
            console.log(`\nTick interval: ${Msg.Tick_Interval_Ms}ms`);
            console.log("---\nStreaming samples:\n");
            Stats_Start = Date.now();
            return;
        }
    }

    // Binary data frame
    const Samples = Decode_Frame(Data);
    Frame_Count++;
    Sample_Count += Samples.length;

    // Print samples (throttle: only every 5th frame to avoid console flood)
    if (Frame_Count % 5 === 0) {
        const Line = Samples.map(
            (s) => `${Param_Name(s.Param_Id)}=${s.Value.toFixed(3)}`
        ).join("  |  ");
        console.log(`[${Format_IRIG(Samples[0].Timestamp)}] ${Line}`);
    }

    // Print throughput stats every 5 seconds
    const Elapsed = (Date.now() - Stats_Start) / 1000;
    if (Elapsed >= 5) {
        console.log(
            `\n--- Stats: ${Frame_Count} frames, ${Sample_Count} samples in ${Elapsed.toFixed(1)}s` +
            ` → ${(Frame_Count / Elapsed).toFixed(1)} fps, ${(Sample_Count / Elapsed).toFixed(1)} sps ---\n`
        );
        Frame_Count = 0;
        Sample_Count = 0;
        Stats_Start = Date.now();
    }
});

WS.on("close", () => console.log("Disconnected."));
WS.on("error", (Err) => console.error("WS error:", Err.message));