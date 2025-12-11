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
// Şimdilik herkese izin veriyoruz, canlıya geçince origin listesi ekleyebilirsin.
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

// 🔹 ROUTES

// UFC Rankings routes
app.use("/api/ufc/rankings", ufcRankingsRoutes);

// Fighters routes
app.use("/api/fighters", fighterRoutes);

// UFC Events routes (liste, refresh, upcoming, past vs.)
app.use("/api/ufc/events", ufcEventsRoutes);

// Favorites routes
app.use("/api/favorites", favoriteRoutes);

// Auth routes
app.use("/api/auth", authRoutes);

// Swagger routes
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Event details routes (tek event + fights)
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
    process.exit(1); // DB bağlanamazsa uygulamayı kapat
  }
};

start();