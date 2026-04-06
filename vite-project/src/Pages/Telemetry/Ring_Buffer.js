/**
 * Ring_Buffer.js
 *
 * SharedArrayBuffer-backed ring buffers for telemetry data.
 * One slot per parameter, each slot holds timestamps + values in circular arrays.
 *
 * Slot layout (per param):
 *   Byte 0-3:   write_index  (Uint32) — next write position, wraps via bitmask
 *   Byte 4-7:   sample_count (Uint32) — total samples written (for detecting new data)
 *   Byte 8+:    interleaved  [timestamp_0, value_0, timestamp_1, value_1, ...]
 *               Each pair = 2 × Float64 = 16 bytes
 *
 * Capacity MUST be a power of 2 for fast modulo via bitmask.
 */

/** Bytes for metadata per slot (write_index + sample_count) */
const META_BYTES = 8;

/**
 * Calculate total SAB size needed.
 * @param {number} Num_Params
 * @param {number} Capacity — samples per param (must be power of 2)
 * @returns {number} — total bytes
 */
export const Calc_SAB_Size = (Num_Params, Capacity) => {
    const Slot_Bytes = META_BYTES + Capacity * 16; // 16 = 2 × Float64
    return Num_Params * Slot_Bytes;
};

/**
 * Get byte offset where a param's slot starts.
 * @param {number} Param_Index — 0-based index into param array (NOT Param_Id)
 * @param {number} Capacity
 * @returns {number}
 */
export const Slot_Offset = (Param_Index, Capacity) => {
    const Slot_Bytes = META_BYTES + Capacity * 16;
    return Param_Index * Slot_Bytes;
};

/**
 * Create views into a param's slot for the WORKER (write side).
 * @param {SharedArrayBuffer} SAB
 * @param {number} Param_Index
 * @param {number} Capacity
 * @returns {{ Meta: Uint32Array, Data: Float64Array, Capacity: number, Mask: number }}
 */
export const Create_Write_View = (SAB, Param_Index, Capacity) => {
    const Offset = Slot_Offset(Param_Index, Capacity);
    return {
        Meta: new Uint32Array(SAB, Offset, 2),         // [write_index, sample_count]
        Data: new Float64Array(SAB, Offset + META_BYTES, Capacity * 2), // interleaved [ts, val, ts, val...]
        Capacity,
        Mask: Capacity - 1, // power-of-2 bitmask for fast wrap
    };
};

/**
 * Create views into a param's slot for the MAIN THREAD (read side).
 * Same structure, just named differently for clarity.
 */
export const Create_Read_View = (SAB, Param_Index, Capacity) => {
    return Create_Write_View(SAB, Param_Index, Capacity);
};

/**
 * Write a sample into a param's ring buffer. Called from the worker.
 * @param {{ Meta: Uint32Array, Data: Float64Array, Mask: number }} View
 * @param {number} Timestamp
 * @param {number} Value
 */
export const Write_Sample = (View, Timestamp, Value) => {
    const Idx = View.Meta[0] & View.Mask;  // current write position, wrapped
    const Data_Idx = Idx * 2;               // interleaved: each slot = 2 floats
    View.Data[Data_Idx] = Timestamp;
    View.Data[Data_Idx + 1] = Value;
    View.Meta[0]++;                         // increment write index (reader sees this)
    View.Meta[1]++;                         // increment total sample count
};

/**
 * Read the latest N samples from a param's ring buffer. Called from main thread.
 * Returns arrays in chronological order (oldest first).
 * @param {{ Meta: Uint32Array, Data: Float64Array, Capacity: number, Mask: number }} View
 * @param {number} N — how many samples to read (clamped to available)
 * @param {Float64Array} Ts_Out — pre-allocated output for timestamps
 * @param {Float64Array} Val_Out — pre-allocated output for values
 * @returns {number} — actual samples read
 */
export const Read_Latest = (View, N, Ts_Out, Val_Out) => {
    const Write_Idx = View.Meta[0];
    const Available = Math.min(N, Math.min(Write_Idx, View.Capacity));

    const Start = Write_Idx - Available;
    for (let i = 0; i < Available; i++) {
        const Ring_Idx = (Start + i) & View.Mask;
        const Data_Idx = Ring_Idx * 2;
        Ts_Out[i] = View.Data[Data_Idx];
        Val_Out[i] = View.Data[Data_Idx + 1];
    }

    return Available;
};

/**
 * Read the latest single value (most recent sample). For live displays/gauges.
 * @param {{ Meta: Uint32Array, Data: Float64Array, Mask: number }} View
 * @returns {{ Timestamp: number, Value: number, Sample_Count: number } | null}
 */
export const Read_Latest_Value = (View) => {
    const Sample_Count = View.Meta[1];
    if (Sample_Count === 0) return null;

    const Idx = (View.Meta[0] - 1) & View.Mask;
    const Data_Idx = Idx * 2;
    return {
        Timestamp: View.Data[Data_Idx],
        Value: View.Data[Data_Idx + 1],
        Sample_Count,
    };
};