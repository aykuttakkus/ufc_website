// src/models/EventsDetail.ts
import mongoose, { Schema, Document } from "mongoose";
import type { IEventFight } from "./UfcEvent";

export interface EventDocument extends Document {
  ufcId: string;
  name: string;
  date: Date;
  location?: string;
  type?: string;
  isUpcoming: boolean;
  subtitle?: string;
  lastDetailsRefreshedAt?: Date;
  fights: IEventFight[];
  createdAt: Date;
  updatedAt: Date;
}

const FightSchema = new Schema<IEventFight>(
  {
    id: { type: String, required: true },
    boutOrder: { type: Number, required: true },

    weightClass: String,

    redName: { type: String, required: true },
    blueName: { type: String, required: true },

    redRank: Number,
    blueRank: Number,

    redCountry: String,
    blueCountry: String,
    redCountryCode: String,
    blueCountryCode: String,

    redOdds: String,
    blueOdds: String,

    // 🔹 Scraper'dan gelen fighter görselleri
    redImageUrl: String,
    blueImageUrl: String,

    // 🔹 Card section bilgisi (Main Card / Prelims / Early Prelims / Unknown)
    cardSection: {
      type: String,
      enum: ["Main Card", "Prelims", "Early Prelims", "Unknown"],
      default: "Unknown",
    },

    // 🔹 Placeholder (TBD vs.)
    isPlaceholder: { type: Boolean, default: false },

    // 🔥 Past event sonuç bilgileri
    // Ödüller: Fight of the Night / Performance of the Night
    fightBonus: String,

    // Kaçıncı round’da bitti
    resultRound: Number,

    // Method: "KO/TKO", "Submission", "Decision - Unanimous" vs.
    resultMethod: String,

    // Süre: "2:31" gibi (round içindeki süre)
    resultTime: String,

    // Kazanan köşe: red / blue / draw / no-contest
    winnerSide: {
      type: String,
      enum: ["red", "blue", "draw", "no-contest"],
    },
  },
  { _id: false }
);

const EventSchema = new Schema<EventDocument>(
  {
    ufcId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    date: { type: Date, required: true },

    location: String,
    type: String, // "Event" vb.
    isUpcoming: { type: Boolean, default: true },

    subtitle: String, // "Sat, Dec 13 / 10:00 PM EST" gibi
    lastDetailsRefreshedAt: Date,

    fights: { type: [FightSchema], default: [] },
  },
  { timestamps: true }
);

export const Event = mongoose.model<EventDocument>("Event", EventSchema);