import { Router } from 'express';
import {
  getShowtimesByFilter,
  getSeats,
  addShowtime,
  getShowtimeDetail,
} from '../controllers/showtime.controller';

import { verifyToken, verifyAdmin } from '../middlewares/auth.middleware';

const showtimeRouter = Router();

showtimeRouter.get('/', getShowtimesByFilter);
showtimeRouter.get('/:id/seats', getSeats);
showtimeRouter.get('/:id', getShowtimeDetail);

// Route cho Admin (Có 2 lớp bảo vệ: Phải có vé, và vé phải là ADMIN)
showtimeRouter.post('/', verifyToken, verifyAdmin, addShowtime);

export default showtimeRouter;
