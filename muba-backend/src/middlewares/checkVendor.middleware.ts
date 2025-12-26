import { NextFunction, Request, Response } from "express";

export const CheckVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    if (user.role !== "vendor" && user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Vendors only" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: `Internal Server Error: ${err}` });
  }
};
