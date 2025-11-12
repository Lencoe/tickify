import { Request, Response, NextFunction } from 'express';

// Allow either a single role or multiple roles
type UserRole = 'admin' | 'merchant' | 'customer';
type RoleInput = UserRole | UserRole[];

export const requireRole = (roles: RoleInput) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user; // type cast since req.user is added dynamically

    if (!user || !user.role) {
      return res.status(401).json({ message: 'Unauthorized: No user found' });
    }

    // normalize input to array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: `Forbidden: Requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};
