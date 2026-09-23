import { Router } from 'express';
import { getMovies, getMovie, createMovie, editMovie } from '../controllers/movie.controller';
import { verifyToken, verifyAdmin } from '../middlewares/auth.middleware';

const movieRouter = Router();

movieRouter.get('/', getMovies);
movieRouter.get('/:id', getMovie);

// Route thêm phim
movieRouter.post('/', verifyToken, verifyAdmin, createMovie);
// Route sửa phim
movieRouter.put('/:id', verifyToken, verifyAdmin, editMovie);

export default movieRouter;
