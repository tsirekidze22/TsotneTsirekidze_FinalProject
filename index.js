const express = require("express");
const userRoutes = require("./routes/userRoutes");
const folderRoutes = require("./routes/folderRoutes");
const shareRoutes = require("./routes/shareRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/user", folderRoutes);
app.use("/api/v1/user", shareRoutes);

// Graceful Shutdown
const gracefulShutdown = () => {
  console.log("Gracefully shutting down...");
  server.close(() => {
    console.log("Closed out remaining requests.");
    process.exit(0);
  });

  // Force shutdown after a timeout (if needed)
  setTimeout(() => {
    console.error("Forcefully shutting down");
    process.exit(1);
  }, 10000); // Timeout in 10 seconds
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start server and capture server object
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
