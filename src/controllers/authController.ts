import { Request, Response } from "express";
import bcrypt from "bcryptjs";
// jsonwebtoken will be used when implementing auth (kept out until used to avoid unused import)

export const register = async (req: Request, res: Response) => {
  return res.json({ message: "Register endpoint stub working ✅" });
};

export const login = async (req: Request, res: Response) => {
  return res.json({ message: "Login endpoint stub working ✅" });
};