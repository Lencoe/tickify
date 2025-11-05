import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload as JwtPayloadType } from 'jsonwebtoken';

interface JwtPayload extends JwtPayloadType {
  id?: string;
  userId?: string;
  role?: string;
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1].trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    const id = payload.id || payload.userId;
    if (!id) return res.status(403).json({ message: 'Forbidden: Invalid token payload' });

    req.user = { id, role: payload.role };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Forbidden: Invalid token' });
  }
};
