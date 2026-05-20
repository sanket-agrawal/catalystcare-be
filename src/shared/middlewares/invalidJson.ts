// src/middlewares/invalidJson.middleware.ts

import { NextFunction, Request, Response } from "express";

export const invalidJsonHandler = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  // Handle invalid JSON errors from express.json()
  if (
    err instanceof SyntaxError &&
    "body" in err &&
    err.status === 400
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload",
    });
  }

  next(err);
};