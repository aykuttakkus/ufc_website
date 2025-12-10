import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

// Kullanıcı id'sinden token üret
export const signToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d"
  });
};

// Token'i doğrula ve içinden userId al
export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
};