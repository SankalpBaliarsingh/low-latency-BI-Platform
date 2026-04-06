/**
    * Signal_Generator.js
    *
    * Generates mock engineering-unit values for each parameter.
    * Each generator is a pure function of elapsed time (seconds) — deterministic, no internal state.
    * 
    * Signals are chosen to exercise different visualization scenarios:
    *   - Ax/Ay/Az: multi-frequency sines + noise → tests strip chart + spectrogram
    *   - P/Q/R:    slow sines → tests attitude indicator + XY plots
    *   - Alt:      ramp + turbulence → tests scrolling strip chart
    *   - IAS:      correlated with Alt + own noise
    *   - EGT/RPM:  step changes (throttle events) + noise → tests alarm bands
*/

const { Param_Catalog } = require("./Param_Catalog");

/** Deterministic noise — good enough for demo, no crypto needed */
const Noise = (amplitude) => (Math.random() - 0.5) * 2 * amplitude;

/**
    * Generators keyed by Param_Id.
    * @param {number} t — elapsed seconds since session start (float64, sub-ms precision)
    * @returns {number} — value in engineering units
*/
const Generators = {
    // --- Accelerations: multi-frequency for spectrogram testing ---
    0: (t) => 1.0 * Math.sin(2 * Math.PI * 0.3 * t)      // base vibration
            + 0.4 * Math.sin(2 * Math.PI * 1.7 * t)       // harmonic
            + Noise(0.15),                                  // sensor noise

    1: (t) => 0.5 * Math.sin(2 * Math.PI * 0.5 * t)
            + 0.2 * Math.sin(2 * Math.PI * 2.3 * t)
            + Noise(0.1),

    2: (t) => 1.0                                           // gravity offset
            + 0.3 * Math.sin(2 * Math.PI * 0.8 * t)
            + Noise(0.12),

    // --- Angular rates: slow sines for attitude indicator ---
    3: (t) => 30 * Math.sin(2 * Math.PI * 0.05 * t)        // roll rate
            + Noise(1.5),

    4: (t) => 15 * Math.sin(2 * Math.PI * 0.08 * t)        // pitch rate
            + Noise(1.0),

    5: (t) => 10 * Math.sin(2 * Math.PI * 0.03 * t)        // yaw rate
            + Noise(0.8),

    // --- Altitude: climb profile with turbulence ---
    6: (t) => {
        const Climb_Phase = Math.min(t / 120, 1.0);         // 0→1 over 2 minutes
        const Base_Alt = Climb_Phase * 8000 + 2000;          // 2000→10000m climb
        const Turb = 20 * Math.sin(2 * Math.PI * 0.15 * t); // turbulence
        return Base_Alt + Turb + Noise(5);
    },

    // --- Airspeed: correlated with altitude phase ---
    7: (t) => {
        const Climb_Phase = Math.min(t / 120, 1.0);
        const Base_IAS = 180 + Climb_Phase * 120;            // 180→300 kn
        return Base_IAS + 8 * Math.sin(2 * Math.PI * 0.1 * t) + Noise(3);
    },

    // --- EGT: step changes simulating throttle events ---
    8: (t) => {
        const Cycle = t % 60;                                 // 60s cycle
        const Base = Cycle < 30 ? 620 : 740;                 // step at 30s
        return Base + Noise(8);
    },

    // --- RPM: step changes tracking EGT ---
    9: (t) => {
        const Cycle = t % 60;
        const Base = Cycle < 30 ? 9500 : 12800;
        return Base + Noise(150);
    },
};

/**
    * Generate_Sample — returns current value for a given param at elapsed time t.
    * @param {number} Param_Id
    * @param {number} t — elapsed seconds since session start
    * @returns {number}
*/
const Generate_Sample = (Param_Id, t) => {
    const Gen = Generators[Param_Id];
    if (!Gen) throw new Error(`No generator for Param_Id ${Param_Id}`);
    return Gen(t);
};

module.exports = Generate_Sample;