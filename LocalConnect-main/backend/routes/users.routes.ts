import { Router } from "express";
import { getPublicUserProfile } from "../services/userService.js";

const router = Router();

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const profile = await getPublicUserProfile(id);
    
    if (!profile) {
      res.status(404).json({ error: "NotFound", message: "User not found" });
      return;
    }
    
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

export default router;
