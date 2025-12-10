// src/models/UfcRanking.ts
import { Schema, model, Document } from "mongoose";

export interface IFighterRank {
  rank: number | null;      // 1,2,3... veya champion için 0
  rankText: string | null;  // "C", "1", "2"...
  isChampion: boolean;
  name: string;
}

export interface IDivision {
  division: string;         // "Lightweight" vs.
  champion: IFighterRank | null;
  fighters: IFighterRank[];      // top 15
}

export interface IUfcRanking extends Document {
  divisions: IDivision[];
  lastRefreshedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FighterRankSchema = new Schema<IFighterRank>(
  {
    rank: { type: Number, default: null },
    rankText: { type: String, default: null },
    isChampion: { type: Boolean, required: true },
    name: { type: String, required: true },
  },
  { _id: false }
);

const DivisionSchema = new Schema<IDivision>(
  {
    division: { type: String, required: true },
    champion: { type: FighterRankSchema, default: null },
    fighters: { type: [FighterRankSchema], default: [] },
  },
  { _id: false }
);

const UfcRankingSchema = new Schema<IUfcRanking>(
  {
    divisions: { type: [DivisionSchema], required: true },
    lastRefreshedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Tek bir rankings dokümanı olacak (singleton pattern)
UfcRankingSchema.index({ createdAt: 1 });

export const UfcRanking = model<IUfcRanking>("UfcRanking", UfcRankingSchema);

