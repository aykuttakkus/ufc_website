import mongoose from "mongoose";
import { MONGODB_URI } from "../src/config/env";
import { User } from "../src/models/User";

async function deleteAllUsers() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected");

    // Tüm kullanıcıları sil
    const result = await User.deleteMany({});
    console.log(`✅ ${result.deletedCount} kullanıcı silindi`);

    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log("✅ Bağlantı kapatıldı");
    process.exit(0);
  } catch (error) {
    console.error("❌ Hata:", error);
    process.exit(1);
  }
}

deleteAllUsers();



