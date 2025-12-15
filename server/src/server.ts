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
app.use(helmet());

/** 🔹 JSON body parse */
app.use(express.json());

/** 🔒 CORS (allowlist) */
const allowedOrigins = [
  "https://ufc.aykuttakkus.com.tr",
  "https://ufc-website.pages.dev",
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl/postman
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (origin.startsWith("http://localhost:")) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

app.use(cors(corsOptions));

/** ✅ Preflight (Express 5 uyumlu) */
app.options(/.*/, cors(corsOptions));

/** 🔹 HEALTH CHECK */
app.get("/api/health", (_req, res) => {
  return res.json({ success: true, message: "API is running" });
});

app.get("/health", (_req, res) => res.status(200).send("ok"));

/** 🔹 ROUTES */
app.use("/api/ufc/rankings", ufcRankingsRoutes);
app.use("/api/fighters", fighterRoutes);
app.use("/api/ufc/events", ufcEventsRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/auth", authRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/ufc", eventDetailsRoutes);

/**
 * ✅ 404 fallback (ZAP'in baktığı /, /api, /robots.txt, /sitemap.xml gibi yollar için)
 * Bu sayede 404 sayfalarında da CSP/Permissions-Policy/Cache-Control net olur.
 */
app.use((_req, res) => {
  res
    .status(404)
    .set({
      "Content-Security-Policy":
        "default-src 'none'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'none'",
      "Permissions-Policy":
        "geolocation=(), camera=(), microphone=(), payment=(), usb=()",
      "Cache-Control": "no-store",
    })
    .json({ success: false, message: "Not found" });
});

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

process.on("unhandledRejection", (reason) => {
  console.error("🔥 unhandledRejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("🔥 uncaughtException:", err);
});