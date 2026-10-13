import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { getPlatformStats, moderateListing } from "../services/adminService.js";

const router = Router();

// Apply auth and admin middleware to all admin endpoints
router.use(requireAuth);
router.use(requireAdmin);

router.get("/stats", async (req, res, next) => {
  try {
    const stats = await getPlatformStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

router.post("/listing/:id/moderate", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    
    if (action !== "approve" && action !== "reject") {
      res.status(400).json({ error: "BadRequest", message: "Action must be approve or reject" });
      return;
    }

    const result = await moderateListing({ listingId: id, action, reason });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
