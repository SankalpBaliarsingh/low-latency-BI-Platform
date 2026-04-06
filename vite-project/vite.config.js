import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import COOP_COEP_Plugin from "./src/Pages/Telemetry/Vite_COOP_COEP_Plugin";

export default defineConfig({
    plugins: [react(), COOP_COEP_Plugin()],
})
