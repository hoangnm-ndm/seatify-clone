import { Request, Response } from 'express';
import {
  getShowtimes,
  getBookedSeats,
  createShowtime,
  getShowtimeById,
} from '../services/showtime.service';

const getShowtimesByFilter = async (req: Request, res: Response) => {
  try {
    const { movieId, cinemaId, date } = req.query;

    if (!movieId || !date) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ID phim và ngày xem!' });
    }

    const showTimes = await getShowtimes(
      movieId as string,
      cinemaId as string | undefined,
      date as string,
    );

    return res.status(200).json({
      message: 'Lấy danh sách suất chiếu thành công!',
      data: showTimes,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: 'Lỗi máy chủ khi lấy suất chiếu!', error: error.message });
    } else {
      res.status(500).json({ message: 'Lỗi máy chủ không xác định!' });
    }
  }
};

const getSeats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Lấy showtimeId từ URL (/api/showtimes/123/seats)

    if (!id) {
      return res.status(400).json({ message: 'Thiếu ID suất chiếu!' });
    }

    const bookedSeats = await getBookedSeats(id as string);

    res.status(200).json({
      message: 'Lấy trạng thái ghế thành công!',
      data: bookedSeats, // Dữ liệu trả về sẽ là mảng: ['A1', 'B2']
    });
  } catch (error) {
    if (error instanceof Error) {
      res
        .status(500)
        .json({ message: 'Lỗi máy chủ khi lấy trạng thái ghế!', error: error.message });
    } else {
      res.status(500).json({ message: 'Lỗi máy chủ không xác định!' });
    }
  }
};

const getShowtimeDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const showtime = await getShowtimeById(id as string);
    res.status(200).json({ message: 'Thành công', data: showtime });
  } catch (error) {
    if (error instanceof Error) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Lỗi server không xác định!' });
    }
  }
};

const addShowtime = async (req: Request, res: Response) => {
  try {
    const { movieId, roomId, startTime, endTime } = req.body;

    // Validation cơ bản
    if (!movieId || !roomId || !startTime || !endTime) {
      return res.status(400).json({ message: 'Vui lòng nhập đủ thông tin suất chiếu!' });
    }

    // Gọi đầu bếp
    const newShowtime = await createShowtime(movieId, roomId, startTime, endTime);

    res.status(201).json({
      message: 'Tạo suất chiếu và khởi tạo 180 vé thành công!',
      data: newShowtime,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: 'Lỗi máy chủ khi tạo suất chiếu!', error: error.message });
    } else {
      res.status(500).json({ message: 'Lỗi máy chủ không xác định!' });
    }
  }
};

export { getShowtimesByFilter, getSeats, getShowtimeDetail, addShowtime };
