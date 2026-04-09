import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

export const validate = (schema: ZodObject<any>) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: "Validation failed",
        errors: error.issues.map((err: any) => ({
          path: err.path.join("."),
          message: err.message,
        })),
      });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};
