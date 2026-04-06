/**
 * Vite_COOP_COEP_Plugin.js
 *
 * SharedArrayBuffer requires cross-origin isolation.
 * This plugin adds the required headers in Vite dev server.
 *
 * Usage in vite.config.js:
 *   import COOP_COEP_Plugin from "./Vite_COOP_COEP_Plugin";
 *   export default defineConfig({ plugins: [react(), COOP_COEP_Plugin()] });
 */

const COOP_COEP_Plugin = () => ({
    name: "coop-coep",
    configureServer(server) {
        server.middlewares.use((req, res, next) => {
            res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
            res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
            next();
        });
    },
});

export default COOP_COEP_Plugin;