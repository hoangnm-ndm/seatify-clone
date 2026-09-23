import { Router } from 'express';
import { createPaymentUrl, confirmPayment } from '../controllers/payment.controller';

const paymentRouter = Router();

// API Frontend gọi để lấy link chuyển hướng
paymentRouter.post('/create-url', createPaymentUrl);
paymentRouter.post('/confirm', confirmPayment);

export default paymentRouter;
