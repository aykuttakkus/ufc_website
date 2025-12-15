import express from "express";
import cors from "cors";
import helmet from "helmet";

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

/** 🔒 Hide framework fingerprint */
app.disable("x-powered-by");

/** 🔒 Basic security headers */
app.use(
  helmet({
    // Swagger UI genelde inline script/style kullanabilir; gerekiyorsa açarız.
    // contentSecurityPolicy: false,
  })
);

/** 🔹 JSON body parse */
app.use(express.json());

/** 🔒 CORS (production için allowlist) */
const allowedOrigins = [
  "https://ufc.aykuttakkus.com.tr",
  "https://ufc-website.pages.dev",
  // Cloudflare Pages preview subdomain'leri gerekiyorsa ekle:
  // "https://08e37a8a.ufc-website.pages.dev",
];

app.use(
  cors({
    origin: (origin, cb) => {
      // origin yoksa (curl/postman/server-to-server) izin ver
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);

      // İstersen dev ortamında localhost'u aç:
      if (origin.startsWith("http://localhost:")) return cb(null, true);

      return cb(new Error(`CORS blocked: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    // cookie/session kullanmıyorsan false kalsın
    credentials: false,
  })
);

// Preflight istekleri
app.options("*", cors());

/** 🔹 HEALTH CHECK */
app.get("/api/health", (_req, res) => {
  return res.json({
    success: true,
    message: "API is running",
  });
});

/** ✅ daha standart kısa health URL */
app.get("/health", (_req, res) => {
  return res.status(200).send("ok");
});

/** 🔹 ROUTES */
app.use("/api/ufc/rankings", ufcRankingsRoutes);
app.use("/api/fighters", fighterRoutes);
app.use("/api/ufc/events", ufcEventsRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/auth", authRoutes);

/**
 * Swagger UI bazen CSP/Helmet ile uğraştırabilir.
 * Eğer swagger ekranı sorun çıkarırsa:
 * - helmet'i route bazında gevşetebiliriz ya da
 * - /api-docs için ayrı middleware kullanırız.
 */
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/ufc", eventDetailsRoutes);

/** 🔹 SERVER START */
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

/** ✅ Crash guard (özellikle scraping gibi yerlerde kritik) */
process.on("unhandledRejection", (reason) => {
  console.error("🔥 unhandledRejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("🔥 uncaughtException:", err);
});