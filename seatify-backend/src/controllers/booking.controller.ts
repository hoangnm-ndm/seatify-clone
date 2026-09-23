import { Request, Response } from 'express';
import {
  holdSeats,
  getBookingById,
  getMyBookings,
  cancelBooking,
} from '../services/booking.service';

interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

const holdBooking = async (req: Request, res: Response) => {
  try {
    const { showtimeId, seatNames, guestInfo, totalPrice, userId } = req.body;

    if (!showtimeId || !seatNames || seatNames.length === 0 || !guestInfo || !totalPrice) {
      return res.status(400).json({ message: 'Thiếu thông tin đặt vé!' });
    }

    const booking = await holdSeats(showtimeId, seatNames, guestInfo, totalPrice, userId);

    res.status(201).json({
      message: 'Giữ ghế thành công! Vui lòng thanh toán trong 5 phút.',
      data: booking,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Lỗi hệ thống khi giữ ghế!' });
    }
  }
};

const getBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await getBookingById(id as string);
    res.status(200).json({ message: 'Lấy hóa đơn thành công', data: booking });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Lỗi hệ thống khi lấy hóa đơn' });
    }
  }
};

const getMyHistory = async (req: AuthRequest, res: Response) => {
  try {
    // Lấy userId ra một cách an toàn
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Không tìm thấy thông tin xác thực!' });
    }

    const bookings = await getMyBookings(userId);

    res.status(200).json({ message: 'Lấy lịch sử thành công', data: bookings });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Lỗi máy chủ không xác định!' });
    }
  }
};

const cancelBookingController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await cancelBooking(id as string);
    res.status(200).json({ message: 'Đã hủy đơn hàng và nhả ghế thành công!' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Lỗi server khi hủy đơn!' });
    }
  }
};

export { holdBooking, getBooking, getMyHistory, cancelBookingController };
