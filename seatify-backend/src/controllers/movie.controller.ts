import { Request, Response } from 'express';
import { getAllMovies, getMovieById, addMovie, updateMovie } from '../services/movie.service';

const getMovies = async (req: Request, res: Response) => {
  try {
    const movies = await getAllMovies();

    res.status(200).json({
      message: 'Lấy danh sách phim thành công!',
      data: movies,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        message: 'Lỗi máy chủ khi lấy danh sách phim!',
        error: error.message,
      });
    } else {
      res.status(500).json({
        message: 'Lỗi máy chủ không xác định!',
      });
    }
  }
};

const getMovie = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const movieId = String(id);
    const movie = await getMovieById(movieId);

    res.status(200).json({
      message: 'Lấy chi tiết phim thành công!',
      data: movie,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Lỗi máy chủ không xác định!' });
    }
  }
};

const createMovie = async (req: Request, res: Response) => {
  try {
    const newMovie = await addMovie(req.body);
    res.status(201).json({
      message: 'Thêm phim mới thành công!',
      data: newMovie,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Lỗi máy chủ không xác định!' });
    }
  }
};

const editMovie = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedMovie = await updateMovie(id as string, req.body);
    res.status(200).json({
      message: 'Cập nhật phim thành công!',
      data: updatedMovie,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Lỗi máy chủ không xác định!' });
    }
  }
};

export { getMovies, getMovie, createMovie, editMovie };
