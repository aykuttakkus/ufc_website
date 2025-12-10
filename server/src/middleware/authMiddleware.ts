import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
}

// Authorization: Bearer <token> kontrol eden middleware
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  // Header yoksa veya "Bearer " ile başlamıyorsa
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    // Token içindeki userId'yi request objesine ekliyoruz
    (req as any).userId = decoded.userId;

    next();
  } catch (err) {
    console.error("authMiddleware error:", err);
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: Invalid token" });
  }
};