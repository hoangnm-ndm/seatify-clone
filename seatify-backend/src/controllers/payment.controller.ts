import { Request, Response } from 'express';
import { createStripeUrl, confirmPaymentSuccess } from '../services/payment.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const createPaymentUrl = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: 'Thiếu mã đơn hàng!' });
    }

    // 1. Kiểm tra hóa đơn, tiện tay lôi luôn tên phim lên
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ticketSeats: {
          include: { showtime: { include: { movie: true } } },
        },
      },
    });

    if (!booking) return res.status(404).json({ message: 'Không tìm thấy đơn hàng!' });
    if (booking.status !== 'PENDING')
      return res.status(400).json({ message: 'Đơn hàng không hợp lệ!' });

    // 2. Lấy tên phim (Lấy từ vé đầu tiên)
    const movieTitle = booking.ticketSeats[0]?.showtime.movie.title || 'Seatify Cinema';

    // 3. Gọi Đầu bếp Stripe
    const paymentUrl = await createStripeUrl(booking.id, booking.totalPrice, movieTitle);

    // 4. Trả link về cho Frontend
    res.status(200).json({
      message: 'Tạo URL Stripe thành công',
      data: { paymentUrl }, // Cái paymentUrl này chính là link của Stripe
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Lỗi máy chủ khi tạo URL thanh toán!' });
    }
  }
};

const confirmPayment = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;
    await confirmPaymentSuccess(bookingId);
    res.status(200).json({ message: 'Chốt đơn thành công! Ghế đã thuộc về bạn.' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Lỗi máy chủ khi xác nhận đơn hàng!' });
    }
  }
};

export { createPaymentUrl, confirmPayment };
