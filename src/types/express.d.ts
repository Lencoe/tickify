import 'express';

declare global {
  namespace Express {
    interface Request {
      // user will be attached by auth middleware after verifying JWT
      user?: {
        id: string;
        role?: string;
      };
    }
  }
}

export {};
