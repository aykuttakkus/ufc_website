// src/routes/fighterRoutes.ts
import { Router } from "express";

import {
  getFighters,
  createFighter,
  getFighterByExternalId,
  updateFighterByExternalId,
  deleteFighterByExternalId,
  patchFighterByExternalId,
  syncFighters,
} from "../controllers/fighterController";

const router = Router();

router.get("/", getFighters);
router.post("/", createFighter);
router.post("/sync", syncFighters);

// 🔥 externalId (slug) tabanlı tüm CRUD
router.get("/:externalId", getFighterByExternalId);
router.put("/:externalId", updateFighterByExternalId);
router.patch("/:externalId", patchFighterByExternalId);
router.delete("/:externalId", deleteFighterByExternalId);

export default router;