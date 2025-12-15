import { Schema, model, Document, Types } from "mongoose";

// Belge arayüzü
export interface IFavorite extends Document {
  user: Types.ObjectId;      // Favori sahibi kullanıcı
  fighter: Types.ObjectId;   // Favoriye eklenen dövüşçü
  note: string;              // Kullanıcı notu
  createdAt: Date;
  updatedAt: Date;
}

// Şema
const FavoriteSchema = new Schema<IFavorite>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fighter: {
      type: Schema.Types.ObjectId,
      ref: "Fighter",
      required: true,
    },
    note: {
      type: String,
      default: "",
    }
  },
  {
    timestamps: true,
  }
);

// 🔥 Aynı user aynı fighter’ı iki kere ekleyemesin
FavoriteSchema.index({ user: 1, fighter: 1 }, { unique: true });

export const Favorite = model<IFavorite>("Favorite", FavoriteSchema);