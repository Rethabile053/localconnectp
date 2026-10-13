import { Router } from "express";
import { getCategoryCountsRPC } from "../services/categoryService.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const counts = await getCategoryCountsRPC();
    res.json(counts);
  } catch (error) {
    next(error);
  }
});

export default router;
