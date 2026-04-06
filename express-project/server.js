// /opt/starrocks/StarRocks-4.0.6-ubuntu-amd64/fe/bin/start_fe.sh --daemon
// /opt/starrocks/StarRocks-4.0.6-ubuntu-amd64/be/bin/start_be.sh --daemon
require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");

const CB_Init = require("./utils/DB/Couchbase/CB_Init");
const Redis_Init = require("./utils/DB/Redis/Redis_Init");
const SR_Init = require("./utils/DB/StarRocks/SR_Init");
const Health_Controller = require("./utils/Basics/Health_Controller");
const authMiddleware = require("./utils/Basics/auth");
const BI_Router = require("./services/BI/Router");
const Attach_WS_Data_Node = require("./services/Telemetry/WS_Data_Node");

const app = express();
const PORT = process.env.PORT || 4000;

const Start_Server = async () => {
    try {
        await CB_Init();
        await Redis_Init();
        await SR_Init();

        app.use(cors());
        app.use(express.json());

        // Health check — no auth required
        app.get("/health", Health_Controller);

        // Auth middleware for everything else
        app.use(authMiddleware);
        app.use("/api", BI_Router);

        // Create HTTP server explicitly so WebSocket can share the port
        const Http_Server = http.createServer(app);

        // Attach telemetry WebSocket data node
        Attach_WS_Data_Node(Http_Server, "/ws/telemetry");

        Http_Server.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`Telemetry WS on ws://localhost:${PORT}/ws/telemetry`);
        });
    } catch (err) {
        console.error("Startup failed:", err.message);
        process.exit(1);
    }
};

Start_Server();