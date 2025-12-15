import { Schema, model, Document } from "mongoose";
import * as bcrypt from "bcrypt";

// Kullanıcı dokümanının TypeScript arayüzü
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  comparePassword(candidate: string): Promise<boolean>;
}

// Kullanıcı şeması
const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: { type: String, required: true, minlength: 6 }
  },
  {
    timestamps: true
  }
);

// Kaydetmeden önce şifreyi hashle ve ismin baş harfini büyük yap
UserSchema.pre("save", async function (next) {
  const user = this as IUser;

  // İsim değiştiyse her kelimenin baş harfini büyük yap
  if (user.isModified("name") && user.name) {
    user.name = user.name.trim();
    user.name = user.name
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  // Şifre değişmediyse tekrar hashleme
  if (!user.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  next();
});

// Kullanıcının girdiği şifreyi DB'deki hash ile karşılaştır
UserSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>("User", UserSchema);