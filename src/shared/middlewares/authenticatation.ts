import ApiResponse from "../../shared/utils/ApiResponse";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if Authorization header is present
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json(new ApiResponse(false, 401, "Unauthorized: Missing or invalid token"));
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET not configured");
    }

    // Verify JWT
    const decoded = jwt.verify(token, secret);

    // Attach decoded user to request
    req.user = decoded;

    next();
  } catch (error: any) {
    console.error("Authentication Error:", error.message);
    return res
      .status(401)
      .json(new ApiResponse(false, 401, "Unauthorized: Invalid or expired token"));
  }
};