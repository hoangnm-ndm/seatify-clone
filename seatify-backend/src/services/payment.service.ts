import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { sendTicketEmail } from './mail.service';

const prisma = new PrismaClient();

// Khởi tạo Stripe với chìa khóa bí mật
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const createStripeUrl = async (bookingId: string, amount: number, movieTitle: string) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  // Yêu cầu Stripe tạo một Phiên giao dịch (Checkout Session)
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'], // Phương thức thanh toán: Thẻ quốc tế
    mode: 'payment', // Thanh toán 1 lần (Không phải trả góp/đăng ký gói)

    // Khai báo giỏ hàng
    line_items: [
      {
        price_data: {
          currency: 'vnd', // Tuyệt vời! Stripe hỗ trợ tiền Việt Nam
          product_data: {
            name: `Vé xem phim: ${movieTitle}`, // In tên phim lên hóa đơn cực chuyên nghiệp
            description: `Mã đơn hàng: ${bookingId}`,
          },
          unit_amount: amount, // Với VND, truyền thẳng số tiền (VD: 200000), không cần nhân 100
        },
        quantity: 1, // Gom chung thành 1 cục thanh toán
      },
    ],

    // Chuyển hướng khi thành công hoặc thất bại
    success_url: `${frontendUrl}/payment-success/${bookingId}`, // Lát ta sẽ tạo trang này ở FE
    cancel_url: `${frontendUrl}/checkout/${bookingId}`, // Bấm hủy thì quay lại trang đếm ngược

    // Gắn cái ID hóa đơn chìm ở dưới để sau này Webhook nhận diện
    client_reference_id: bookingId,
  });

  return session.url; // Trả về cái link giao diện siêu đẹp của Stripe!
};

// HÀM CHỐT ĐƠN VÀ IN VÉ VĨNH VIỄN
const confirmPaymentSuccess = async (bookingId: string) => {
  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Không tìm thấy đơn hàng!');

    // Nếu đơn đã SUCCESS rồi thì không làm gì nữa (Chống gọi API 2 lần)
    if (booking.status === 'SUCCESS') return booking;

    // 1. Chuyển hóa đơn sang ĐÃ THANH TOÁN
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'SUCCESS' },
    });

    // 2. Chuyển toàn bộ ghế sang ĐÃ BÁN (BOOKED) và gỡ bỏ đồng hồ đếm ngược
    await tx.ticketSeat.updateMany({
      where: { bookingId: bookingId },
      data: {
        status: 'BOOKED',
        lockedUntil: null, // Xóa thời hạn giữ ghế
      },
    });

    // 3. Lấy lại toàn bộ thông tin hóa đơn (có lồng thông tin Phim/Rạp) để làm nội dung Email
    const fullBookingData = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        ticketSeats: {
          include: {
            seat: true,
            showtime: { include: { movie: true, room: { include: { cinema: true } } } },
          },
        },
      },
    });

    // 4. GỌI BƯU TÁ ĐI GIAO THƯ KHI TRANSACTION THÀNH CÔNG
    if (fullBookingData && fullBookingData.guestEmail) {
      // Gửi bất đồng bộ (không await) để web không bị treo đợi gửi mail
      sendTicketEmail(fullBookingData.guestEmail, fullBookingData);
    }

    return updatedBooking;
  });
};

export { createStripeUrl, confirmPaymentSuccess };
