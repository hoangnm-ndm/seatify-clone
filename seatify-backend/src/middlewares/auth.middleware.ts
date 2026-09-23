import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

dotenv.config();

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Bạn chưa đăng nhập hoặc vé không hợp lệ!' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string);

    req.user = decoded as { userId: string; role: string }; //req.user

    next();
  } catch (error) {
    if (error instanceof Error) {
      return res.status(401).json({ message: 'Vé thông hành giả hoặc đã hết hạn!' });
    } else {
      return res.status(500).json({ message: 'Lỗi máy chủ không xác định!' });
    }
  }
};

export const verifyAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user;

  if (user && user.role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Bạn không phải là Admin!' });
  }
};
