// src/models/Fighter.ts
import { Schema, model, Document } from "mongoose";

export interface IFighter extends Document {
  externalId: string;      // Octagon slug / id (ör: "islam-makhachev")
  name: string;
  nickname?: string;
  weightClass: string;     // Örn: "Lightweight"
  country?: string;
  wins: number;
  losses: number;
  draws: number;
  status?: string;         // Örn: "Active"
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FighterSchema = new Schema<IFighter>(
  {
    externalId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nickname: {
      type: String,
      trim: true,
    },
    weightClass: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
    draws: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt otomatik gelir
  }
);

// İsim + lakap için text search index
FighterSchema.index({ name: "text", nickname: "text" });

export const Fighter = model<IFighter>("Fighter", FighterSchema);