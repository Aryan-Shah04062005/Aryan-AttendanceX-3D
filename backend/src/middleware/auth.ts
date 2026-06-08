import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const getJwtSecret = () => process.env.JWT_SECRET || 'fallback-super-secret-attendance-key';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: 'admin' | 'employee';
  };
}

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Bearer <token>

    jwt.verify(token, getJwtSecret(), (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
      }
      req.user = user as { id: string; username: string; role: 'admin' | 'employee' };
      next();
    });
  } else {
    res.status(401).json({ message: 'Authorization token is required.' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
    return;
  }
  next();
}

export function requireEmployee(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'employee') {
    res.status(403).json({ message: 'Access denied. Employee permissions required.' });
    return;
  }
  next();
}

export function requireAnyRole(roles: ('admin' | 'employee')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
       res.status(403).json({ message: 'Access denied. Unauthorized role.' });
       return;
    }
    next();
  };
}
