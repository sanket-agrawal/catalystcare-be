import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError, infer as zInfer } from "zod";

export const validateRequest =
  <T extends ZodType>(schema: T) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed as zInfer<T>;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((e) => e.message);
        return res.status(400).json({ message: "Validation failed", errors });
      }
      next(error);
    }
  };
