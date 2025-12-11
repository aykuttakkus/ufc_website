import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 5050;
export const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
export const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ufc_fighters";