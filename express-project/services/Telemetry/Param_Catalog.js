/**
    * Param_Catalog.js
    * 
    * Defines mock flight test parameters.
    * Each param has a numeric ID (uint16 on the wire), name, unit, range, and sample rate.
    * 
    * Rate tiers (scaled down ~100x for demo):
    *   Fast  = 5 Hz   (real: 500 Hz)  — vibration, accelerations
    *   Med   = 2 Hz   (real: 200 Hz)  — angular rates
    *   Slow  = 1 Hz   (real: 50-100 Hz) — airdata, engine
*/

const RATE_FAST = 5;
const RATE_MED  = 2;
const RATE_SLOW = 1;

const Param_Catalog = [
    { Param_Id: 0,  Name: "Ax",       Unit: "g",     Min: -5,    Max: 5,     Rate_Hz: RATE_FAST },
    { Param_Id: 1,  Name: "Ay",       Unit: "g",     Min: -3,    Max: 3,     Rate_Hz: RATE_FAST },
    { Param_Id: 2,  Name: "Az",       Unit: "g",     Min: -5,    Max: 5,     Rate_Hz: RATE_FAST },
    { Param_Id: 3,  Name: "P",        Unit: "deg/s", Min: -180,  Max: 180,   Rate_Hz: RATE_MED  },
    { Param_Id: 4,  Name: "Q",        Unit: "deg/s", Min: -90,   Max: 90,    Rate_Hz: RATE_MED  },
    { Param_Id: 5,  Name: "R",        Unit: "deg/s", Min: -90,   Max: 90,    Rate_Hz: RATE_MED  },
    { Param_Id: 6,  Name: "Alt",      Unit: "m",     Min: 0,     Max: 15000, Rate_Hz: RATE_SLOW },
    { Param_Id: 7,  Name: "IAS",      Unit: "kn",    Min: 0,     Max: 450,   Rate_Hz: RATE_SLOW },
    { Param_Id: 8,  Name: "EGT",      Unit: "degC",  Min: 300,   Max: 900,   Rate_Hz: RATE_SLOW },
    { Param_Id: 9,  Name: "RPM",      Unit: "rpm",   Min: 0,     Max: 16000, Rate_Hz: RATE_SLOW },
];

/** Bytes per sample on the wire: uint16 (id) + float64 (ts) + float64 (val) */
const BYTES_PER_SAMPLE = 2 + 8 + 8; // 18

/*
    * Frame header: uint16 sample_count - first 2 bytes of every WebSocket message
    * It's a single uint16 that tells how many samples are packed into this frame.
    * Message = [2 bytes: sample_count] [18 bytes: sample₀] [18 bytes: sample₁] ... [18 bytes: sampleₙ₋₁]
*/
const FRAME_HEADER_BYTES = 2;

module.exports = { Param_Catalog, BYTES_PER_SAMPLE, FRAME_HEADER_BYTES };