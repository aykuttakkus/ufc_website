import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import { PORT } from "./config/env";
import fighterRoutes from "./routes/fighterRoutes";
import favoriteRoutes from "./routes/favoriteRoutes";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./config/swagger";
import authRoutes from "./routes/authRoutes";
import ufcRankingsRoutes from "./routes/ufcRankingsRoutes";
import ufcEventsRoutes from "./routes/ufcEventsRoutes";
import eventDetailsRoutes from "./routes/eventDetailsRoutes";

const app = express();

// 🔹 JSON body parse
app.use(express.json());

// 🔹 CORS
app.use(
  cors({
    origin: "*",
  })
);

// 🔹 HEALTH CHECK
app.get("/api/health", (_req, res) => {
  return res.json({
    success: true,
    message: "API is running",
  });
});

// ✅ (Opsiyonel) daha standart kısa health URL
app.get("/health", (_req, res) => {
  return res.status(200).send("ok");
});

// 🔹 ROUTES
app.use("/api/ufc/rankings", ufcRankingsRoutes);
app.use("/api/fighters", fighterRoutes);
app.use("/api/ufc/events", ufcEventsRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/auth", authRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/ufc", eventDetailsRoutes);

// 🔹 SERVER START
const start = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

start();

// ✅ Crash guard (özellikle scraping gibi yerlerde kritik)
process.on("unhandledRejection", (reason) => {
  console.error("🔥 unhandledRejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("🔥 uncaughtException:", err);
});