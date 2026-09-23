import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import {
  holdBooking,
  getBooking,
  getMyHistory,
  cancelBookingController,
} from '../controllers/booking.controller';

const bookingRouter = Router();

bookingRouter.post('/hold', holdBooking);
bookingRouter.get('/my-history', verifyToken, getMyHistory);
bookingRouter.get('/:id', getBooking);
bookingRouter.post('/:id/cancel', cancelBookingController);

export default bookingRouter;
