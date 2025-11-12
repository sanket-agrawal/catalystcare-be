// src/middlewares/checkRole.ts
import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../shared/utils/ApiResponse";

/**
 * Role-based access control middleware
 * Example: router.get('/admin-only', authenticate, authorizeRoles('ADMIN'), handler)
 */
export const authorizeRoles =
  (...allowedRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json(new ApiResponse(false, 401, "Unauthorized: No user found in request"));
      }

      if (!allowedRoles.includes(user.role)) {
        return res
          .status(403)
          .json(new ApiResponse(false, 403, "Access denied: Insufficient permissions"));
      }

      next();
    } catch (error: any) {
      console.error("Authorization Error:", error.message);
      return res
        .status(500)
        .json(new ApiResponse(false, 500, "Internal server error in role check"));
    }
  };
