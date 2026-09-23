import { Router } from 'express';
import authRouter from './auth.routes';
import movieRouter from './movie.routes';
import cinemaRouter from './cinema.routes';
import showtimeRouter from './showtime.routes';
import bookingRouter from './booking.routes';
import paymentRouter from './payment.routes';

const rootRouter = Router();

rootRouter.use('/auth', authRouter);
rootRouter.use('/movies', movieRouter);
rootRouter.use('/cinemas', cinemaRouter);
rootRouter.use('/showtimes', showtimeRouter);
rootRouter.use('/bookings', bookingRouter);
rootRouter.use('/payments', paymentRouter);

export default rootRouter;
