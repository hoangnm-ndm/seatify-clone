import { Router, Request, Response } from 'express';
import { register, login } from '../controllers/auth.controller';
import { AuthRequest, verifyToken, verifyAdmin } from '../middlewares/auth.middleware';

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);

authRouter.get('/profile', verifyToken, (req: AuthRequest, res: Response) => {
  res.status(200).json({
    message: 'Chào mừng bạn đến với khu vực cá nhân!',
    user: req.user,
  });
});

authRouter.get('/admin-dashboard', verifyToken, verifyAdmin, (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Chào mừng Admin!',
  });
});

export default authRouter;
