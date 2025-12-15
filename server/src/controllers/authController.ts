import { Request, Response } from "express";
import { User } from "../models/User";
import { signToken } from "../utils/jwt";

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Email'i lowercase'e çevir (schema'da lowercase: true var)
    const normalizedEmail = email.toLowerCase().trim();

    // Email zaten kayıtlı mı?
    const exist = await User.findOne({ email: normalizedEmail });
    if (exist) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }

    // Yeni user oluştur (şifre pre-save ile hashlenecek)
    const user = await User.create({ name, email: normalizedEmail, password });

    // JWT token üret
    const token = signToken(user._id.toString());

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (err: any) {
    console.error("register error:", err);
    res
      .status(400)
      .json({ success: false, message: err.message || "Bad request" });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Email'i lowercase'e çevir (schema'da lowercase: true var)
    const normalizedEmail = email.toLowerCase().trim();

    // Kullanıcı var mı?
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Şifre doğru mu?
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Token üret
    const token = signToken(user._id.toString());

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (err: any) {
    console.error("login error:", err);
    res
      .status(400)
      .json({ success: false, message: err.message || "Bad request" });
  }
};

// POST /api/auth/check-email
export const checkEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    // Email'i lowercase'e çevir (schema'da lowercase: true var)
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select("_id");

    return res.json({
      success: true,
      data: {
        exists: !!user
      }
    });
  } catch (err: any) {
    console.error("checkEmail error:", err);
    res
      .status(400)
      .json({ success: false, message: err.message || "Bad request" });
  }
};