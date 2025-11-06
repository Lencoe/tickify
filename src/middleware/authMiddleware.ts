import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload as JwtPayloadType } from 'jsonwebtoken';

interface JwtPayload extends JwtPayloadType {
  id?: string;
  role?: 'admin' | 'merchant' | 'customer';
}

// Extend Express Request to include `user`
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: 'admin' | 'merchant' | 'customer' };
    }
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1].trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    if (!payload.id || !payload.role) {
      return res.status(403).json({ message: 'Forbidden: Invalid token payload' });
    }

    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Forbidden: Invalid token' });
  }
};
