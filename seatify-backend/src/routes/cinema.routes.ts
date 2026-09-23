import { Router } from 'express';
import { getCinemas } from '../controllers/cinema.controller';

const cinemaRouter = Router();

cinemaRouter.get('/', getCinemas);

export default cinemaRouter;
