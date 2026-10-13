import { Request, Response, NextFunction } from "express";
import { getSupabaseServiceClient } from "../services/supabaseClient.js";

// Extend Request type to include auth
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role?: string;
        claims?: any;
      };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized", message: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const supabase = getSupabaseServiceClient();

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid token" });
      return;
    }

    req.auth = {
      userId: user.id,
      role: user.role,
      claims: user.app_metadata,
    };
    next();
  } catch (error) {
    res.status(500).json({ error: "AuthError", message: "Error verifying authentication token" });
    return;
  }
}
