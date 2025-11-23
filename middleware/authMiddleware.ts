// auth middleware 
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        email: string;
        
      };
    }
  }
}
class AuthMiddleware {
  // Middleware to verify JWT token
  verifyToken(req: Request, res: Response, next: NextFunction) {   
    const token = req.headers.authorization?.split(" ")[1]; // Expecting 'Bearer <token>'
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
      req.user = { _id: decoded._id as string, email: decoded.email as string };
      next();
    } catch (error) {
      return res.status(401).json({ error: "Invalid token or token expired" });
    }
   }
}

export const authMiddleware = new AuthMiddleware();