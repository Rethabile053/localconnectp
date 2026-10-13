import { Request, Response, NextFunction } from "express";

export function validateRequest(schema: any) {
  // Placeholder for a validation schema approach (e.g. Zod or Joi)
  // For now, we will do manual validation inside the routes or standard handlers
  return (req: Request, res: Response, next: NextFunction) => {
    next();
  };
}
