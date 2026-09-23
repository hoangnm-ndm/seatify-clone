import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface GuestInfo {
  fullName: string;
  email: string;
  phone: string;
}

interface LockedTicketSeat {
  id: string;
  status: string;
  lockedUntil: Date | null;
}

const holdSeats = async (
  showtimeId: string,
  seatNames: string[],
  guestInfo: GuestInfo,
  totalPrice: number,
  userId?: string,
) => {
  // 1. Phân tách mảng tên ghế ['A1', 'B2'] thành Row và Number để tìm trong DB
  // VD: 'A1' -> row: 'A', number: 1
  const seatConditions = seatNames.map((name) => ({
    row: name.charAt(0),
    number: parseInt(name.slice(1)),
  }));

  // MỞ TRANSACTION: Đảm bảo luật ALL or NOTHING (Thành công hết hoặc hủy hết)
  return await prisma.$transaction(async (tx) => {
    const showtime = await tx.showtime.findUnique({ where: { id: showtimeId } });
    if (!showtime) throw new Error('Không tìm thấy suất chiếu!');
    // 2. Tìm ID của các ghế vật lý trong phòng dựa vào Row và Number
    const physicalSeats = await tx.seat.findMany({
      where: {
        roomId: showtime.roomId,
        OR: seatConditions,
      },
    });

    if (physicalSeats.length !== seatNames.length) {
      throw new Error('Một số ghế không tồn tại trong phòng chiếu này!');
    }

    const physicalSeatIds = physicalSeats.map((s) => s.id);

    // 3. Tìm các vé (TicketSeat) tương ứng với suất chiếu và các ghế vật lý trên
    const ticketSeats = await tx.ticketSeat.findMany({
      where: {
        showtimeId: showtimeId,
        seatId: { in: physicalSeatIds },
      },
    });

    const ticketSeatIds = ticketSeats.map((ts) => ts.id);

    // ====================================================================
    // 4. PESSIMISTIC LOCKING (KHÓA BI QUAN BẰNG RAW SQL)
    // Lệnh này ép PostgreSQL khóa cứng các dòng TicketSeat này lại.
    // Nếu có 2 Request gọi cùng 1 mili-giây, 1 thằng sẽ bị bắt đứng xếp hàng chờ!
    // ====================================================================
    const lockedTicketSeats = await tx.$queryRaw<LockedTicketSeat[]>`
      SELECT id, status, "lockedUntil" 
      FROM "TicketSeat" 
      WHERE id IN (${Prisma.join(ticketSeatIds)}) 
      FOR UPDATE
    `;

    // 5. Kiểm tra xem có ghế nào đã bị người khác nẫng tay trên không?
    const now = new Date();
    for (const ts of lockedTicketSeats) {
      // Ghế đã BÁN, hoặc đang HOLDING và chưa hết hạn 5 phút
      if (
        ts.status === 'BOOKED' ||
        (ts.status === 'HOLDING' && ts.lockedUntil && ts.lockedUntil > now)
      ) {
        throw new Error('Rất tiếc! Ghế bạn chọn hiện đã có người chọn. Vui lòng chọn ghế khác!');
      }
    }

    // 6. TẤT CẢ GHẾ ĐỀU AN TOÀN -> TẠO HÓA ĐƠN NHÁP
    const newBooking = await tx.booking.create({
      data: {
        userId: userId || null, //Kết nối với hóa đơn khách
        guestName: guestInfo.fullName,
        guestEmail: guestInfo.email,
        guestPhone: guestInfo.phone,
        totalPrice: totalPrice,
        status: 'PENDING', // Đang chờ thanh toán
      },
    });

    // 7. CẬP NHẬT TRẠNG THÁI VÉ -> GIỮ CHỖ 5 PHÚT
    const holdExpirationTime = new Date(now.getTime() + 5 * 60000); // Hiện tại + 5 phút

    await tx.ticketSeat.updateMany({
      where: { id: { in: ticketSeatIds } },
      data: {
        status: 'HOLDING',
        lockedUntil: holdExpirationTime,
        bookingId: newBooking.id,
      },
    });

    // Trả về ID của hóa đơn để Frontend chuyển sang trang Thanh toán
    return newBooking;
  });
};

const getBookingById = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    // CHUẨN SENIOR: Dùng 'select' để chỉ định đích danh từng cột cần lấy
    select: {
      id: true,
      guestName: true,
      guestEmail: true,
      guestPhone: true,
      totalPrice: true,
      status: true,
      userId: true,
      ticketSeats: {
        select: {
          lockedUntil: true,
          seat: {
            select: { row: true, number: true }, // Chỉ lấy dòng và số ghế
          },
          showtime: {
            select: {
              startTime: true,
              movie: { select: { title: true, ageRating: true } }, // Không lấy mô tả, trailer...
              room: {
                select: {
                  name: true,
                  cinema: { select: { name: true, location: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!booking) throw new Error('Không tìm thấy hóa đơn này!');
  return booking;
};

const getMyBookings = async (userId: string) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: userId },
    orderBy: { createdAt: 'desc' },
    // CHUẨN SENIOR: Giảm thiểu tối đa dung lượng để tải danh sách nhanh hơn
    select: {
      id: true,
      totalPrice: true,
      status: true,
      createdAt: true,
      ticketSeats: {
        select: {
          showtime: {
            select: {
              movie: { select: { title: true } },
              room: {
                select: {
                  cinema: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  return bookings;
};

//HỦY ĐƠN VÀ TRẢ GHẾ
const cancelBooking = async (bookingId: string) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Kiểm tra hóa đơn
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Không tìm thấy hóa đơn!');
    if (booking.status !== 'PENDING')
      throw new Error('Chỉ có thể hủy hóa đơn đang chờ thanh toán!');

    // 2. Đổi trạng thái hóa đơn thành FAILED (Đã hủy)
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'FAILED' },
    });

    // 3. Trả lại toàn bộ ghế của hóa đơn này về thị trường
    await tx.ticketSeat.updateMany({
      where: { bookingId: bookingId },
      data: {
        status: 'AVAILABLE', // Ghế trở lại màu trắng
        bookingId: null, // Gỡ liên kết hóa đơn
        lockedUntil: null, // Gỡ đồng hồ khóa
      },
    });

    return updatedBooking;
  });
};

export { holdSeats, getBookingById, getMyBookings, cancelBooking };
