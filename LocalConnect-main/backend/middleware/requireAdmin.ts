import { Request, Response, NextFunction } from "express";
import { getSupabaseServiceClient } from "../services/supabaseClient.js";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.auth || !req.auth.userId) {
    res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
    return;
  }

  const supabase = getSupabaseServiceClient();

  try {
    const { data, error } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", req.auth.userId)
      .single();

    if (error || !data) {
      res.status(403).json({ error: "Forbidden", message: "Admin privileges required" });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "AuthorizationError", message: "Error validating admin status" });
    return;
  }
}
