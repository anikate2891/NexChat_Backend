import "dotenv/config";

import app from "./src/app.js";
import connectDB from "./src/config/database.js";
import http from "http";
import { initSocketServer } from "./src/sockets/server.socket.js";

const PORT = process.env.PORT || 8000;

const httpServer = http.createServer(app);
initSocketServer(httpServer);

connectDB()
    .catch((err) => {
        console.error("MongoDB connection failed:", err);
        process.exit(1);
    });



httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});