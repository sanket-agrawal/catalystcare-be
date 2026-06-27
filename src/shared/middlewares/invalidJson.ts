import ApiResponse from "../utils/ApiResponse";
import { NextFunction, Request, Response } from "express";

interface JsonSyntaxError extends SyntaxError {
  status?: number;
  body?: unknown;
}

export const invalidJsonHandler = (
  err: JsonSyntaxError,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    return res
            .status(400)
            .json(new ApiResponse(false, 400, "Invalid JSON payload"));
  }

  next(err);
};