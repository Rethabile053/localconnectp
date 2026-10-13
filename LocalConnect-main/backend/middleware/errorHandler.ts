import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("Global Error Handler:", err);

  const statusCode = err.status || 500;
  const errorResponse = {
    error: err.name || "InternalServerError",
    message: err.message || "An unexpected error occurred",
    details: err.details || {},
  };

  res.status(statusCode).json(errorResponse);
}
