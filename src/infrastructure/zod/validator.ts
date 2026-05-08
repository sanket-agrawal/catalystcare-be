import { ZodObject } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: ZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      next();
    } catch (err: any) {
      console.log(err)
      return res.status(400).json({
        message: "Validation failed",
        errors: err.issues.map((issue : any) => ({
            ...issue
        })),
      });
    }
  };