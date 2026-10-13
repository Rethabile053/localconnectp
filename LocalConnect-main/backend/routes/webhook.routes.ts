import { Router } from "express";
import { handleAuthWebhook, handleListingWebhook } from "../services/webhookService.js";

const router = Router();

// Endpoint for supabase auth webhooks
router.post("/auth", async (req, res, next) => {
  try {
    const { type, record } = req.body;
    // NOTE: In production, verify the webhook signature here
    
    await handleAuthWebhook({ type, data: record });
    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

// Endpoint for supabase database listing webhooks
router.post("/listing", async (req, res, next) => {
  try {
    const { type, record } = req.body;
    // NOTE: In production, verify the webhook signature here
    
    await handleListingWebhook({ type, record });
    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

export default router;
