import { Router } from "express";
import { register, login, checkEmail } from "../controllers/authController";

const router = Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/check-email
router.post("/check-email", checkEmail);

export default router;