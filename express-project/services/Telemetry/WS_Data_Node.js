/**
    * WS_Data_Node.js
    *
    * Attaches a WebSocket server to an existing HTTP server.
    * Simulates an enriched-data node: consumes from Redpanda (mocked here) and
    * pushes binary frames to connected browsers.
    *
    * Binary frame format:
    *   Header:  uint16  Sample_Count
    *   Repeat Sample_Count times:
    *     uint16   Param_Id
    *     float64  Timestamp   (IRIG-style: seconds since midnight UTC, float64)
    *     float64  Value       (engineering units)
    *
    * Tick rate: 100ms (10 Hz internal clock).
    * Each param only emits when its own rate divides evenly into the tick count,
    * so a 5 Hz param emits every 2nd tick, a 1 Hz param every 10th tick.
*/

const { WebSocketServer } = require("ws");
const { Param_Catalog, BYTES_PER_SAMPLE, FRAME_HEADER_BYTES } = require("./Param_Catalog");
const Generate_Sample = require("./Signal_Generator");

/** Internal tick interval in ms — sets the GCD resolution for all rates */
const TICK_INTERVAL_MS = 100;
const TICKS_PER_SECOND = 1000 / TICK_INTERVAL_MS;

/**
    * Pre-compute how often each param fires (in ticks).
    * E.g. 5 Hz param → every 2 ticks at 10 Hz tick rate.
*/
const Param_Tick_Divisors = Param_Catalog.map((p) => ({
    ...p,
    Tick_Divisor: TICKS_PER_SECOND / p.Rate_Hz,
}));

/**
    * Get IRIG-style timestamp: seconds since midnight UTC today.
    * In production, Flink stamps this from the decommutator's IRIG time.
    * For mock, we derive from wall clock.
*/
const Get_IRIG_Timestamp = () => {
    const Now = new Date();
    return (
        Now.getUTCHours() * 3600 +
        Now.getUTCMinutes() * 60 +
        Now.getUTCSeconds() +
        Now.getUTCMilliseconds() / 1000
    );
};

/**
    This function runs once per tick and builds the binary blob that goes over the WebSocket.    
    * Build a binary frame for the current tick.
    * @param {number} Tick_Count — monotonic tick counter
    * @param {number} Session_Start_S — performance.now()/1000 at session start
    * @returns {Buffer|null} — null if no params fire this tick
    
    * Step 1 — Who fires this tick?
        Tick 0: everyone fires.
        Tick 1: nobody 
        Tick 2: 5 Hz params fire (every 2 ticks)
    * Step 2 — Allocate the buffer. 
        Calculates exact byte size: 2 bytes header + (active param count × 18 bytes each). 
        No wasted space.
    Step 3 — Write header. 
        First 2 bytes = sample count, so the receiver knows how many 18-byte chunks to read.
    Step 4 — 
        Write samples. 
        Loops through active params. 
        For each one, writes 3 fields back to back starting at the current offset:
            Offset +0: param ID (2 bytes)
            Offset +2: IRIG timestamp (8 bytes) — same timestamp for all samples in this tick since they're simultaneous
            Offset +10: the generated value (8 bytes)
    
    

*/
const Build_Frame = (Tick_Count, Session_Start_S) => {
    // Determine which params fire this tick
    const Active_Params = Param_Tick_Divisors.filter(
        (p) => Tick_Count % p.Tick_Divisor === 0
    );

    if (Active_Params.length === 0) return null;

    const Sample_Count = Active_Params.length;
    const Frame_Size = FRAME_HEADER_BYTES + Sample_Count * BYTES_PER_SAMPLE;
    const Buf = Buffer.alloc(Frame_Size);

    // Header
    Buf.writeUInt16BE(Sample_Count, 0);

    // Elapsed time for signal generators
    const Elapsed_S = (performance.now() / 1000) - Session_Start_S;
    const Timestamp = Get_IRIG_Timestamp();

    let Offset = FRAME_HEADER_BYTES;
    for (const Param of Active_Params) {
        const Value = Generate_Sample(Param.Param_Id, Elapsed_S);

        Buf.writeUInt16BE(Param.Param_Id, Offset);
        Buf.writeDoubleBE(Timestamp, Offset + 2);
        Buf.writeDoubleBE(Value, Offset + 10);

        Offset += BYTES_PER_SAMPLE;
    }

    return Buf;
};

/**
    One worker per data node connection, but one shared SharedArrayBuffer across all workers
    The ring buffer layout is keyed by param ID, not by data node. 
    So worker A (connected to the engine node) writes to param slots 0–15.
    Worker B (connected to the avionics node) writes to param slots 16–40 — different regions of the same SAB.

    * Attach_WS_Data_Node — sets up the WebSocket server + tick loop.
    * @param {http.Server} Http_Server — the existing HTTP server from Express
    * @param {string} [Path="/ws/telemetry"] — WebSocket endpoint path
*/
const Attach_WS_Data_Node = (Http_Server, Path = "/ws/telemetry") => {
    const WSS = new WebSocketServer({ server: Http_Server, path: Path });

    const Session_Start_S = performance.now() / 1000;
    let Tick_Count = 0;
    let Client_Count = 0;

    // --- Tick loop: runs regardless of connections ---
    const Tick_Timer = setInterval(() => {
        if (WSS.clients.size === 0) {
            Tick_Count++;
            return; // no clients, skip frame build
        }

        const Frame = Build_Frame(Tick_Count, Session_Start_S);
        Tick_Count++;

        if (!Frame) return;

        // Broadcast to all connected clients
        for (const Client of WSS.clients) {
            if (Client.readyState === Client.OPEN) {
                Client.send(Frame);
            }
        }
    }, TICK_INTERVAL_MS);

    // --- Connection handling ---
    WSS.on("connection", (WS, Req) => {
        Client_Count++;
        const Client_Id = Client_Count;
        console.log(`[WS_Data_Node] Client ${Client_Id} connected from ${Req.socket.remoteAddress}`);

        // Send param catalog as first message (JSON — one-time handshake)
        const Handshake = JSON.stringify({
            Type: "PARAM_CATALOG",
            Params: Param_Catalog,
            Tick_Interval_Ms: TICK_INTERVAL_MS,
        });
        WS.send(Handshake);

        WS.on("close", () => {
            console.log(`[WS_Data_Node] Client ${Client_Id} disconnected`);
        });

        WS.on("error", (Err) => {
            console.error(`[WS_Data_Node] Client ${Client_Id} error:`, Err.message);
        });
    });

    // Cleanup on server shutdown
    const Cleanup = () => {
        clearInterval(Tick_Timer);
        WSS.close();
        console.log("[WS_Data_Node] Shut down.");
        process.exit(0);  // ensure exit after cleanup
    };

    process.on("SIGTERM", Cleanup);
    process.on("SIGINT", Cleanup);

    console.log(`[WS_Data_Node] Listening on path: ${Path}`);
    console.log(`[WS_Data_Node] Tick rate: ${TICKS_PER_SECOND} Hz, params: ${Param_Catalog.length}`);
    console.log(`[WS_Data_Node] Param rates: ${[...new Set(Param_Catalog.map((p) => p.Rate_Hz))].join(", ")} Hz`);

    return { WSS, Cleanup };
};

module.exports = Attach_WS_Data_Node;