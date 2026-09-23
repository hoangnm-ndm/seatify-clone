import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const startCronJobs = () => {
  // Biểu thức '* * * * *' nghĩa là: Chạy lặp lại vào mỗi phút
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // 1. Tìm tất cả các ghế đang bị giam mà đã quá hạn 5 phút
      const expiredSeats = await prisma.ticketSeat.findMany({
        where: {
          status: 'HOLDING',
          lockedUntil: { lte: now }, // lte: Less than or equal (Nhỏ hơn hoặc bằng giờ hiện tại)
        },
        select: { bookingId: true }, // Tối ưu: Chỉ lấy lên cái mã Hóa đơn, không lấy dư thừa
      });

      if (expiredSeats.length > 0) {
        // Lọc ra danh sách các mã Hóa đơn (loại bỏ trùng lặp nếu 1 hóa đơn mua 2 ghế)
        const bookingIds = [
          ...new Set(expiredSeats.map((s) => s.bookingId).filter((id) => id !== null)),
        ] as string[];

        // 2. TRANSACTION: Đảm bảo trả ghế và hủy hóa đơn phải diễn ra trọn vẹn
        await prisma.$transaction(async (tx) => {
          // A. Trả ghế về AVAILABLE
          await tx.ticketSeat.updateMany({
            where: {
              status: 'HOLDING',
              lockedUntil: { lte: now },
            },
            data: {
              status: 'AVAILABLE',
              lockedUntil: null,
              bookingId: null,
            },
          });

          // B. Đánh dấu Hóa đơn thành FAILED
          await tx.booking.updateMany({
            where: {
              id: { in: bookingIds },
              status: 'PENDING',
            },
            data: { status: 'FAILED' },
          });
        });

        console.log(
          `🧹 [Cronjob] Đã tự động nhả ${expiredSeats.length} ghế và hủy ${bookingIds.length} hóa đơn hết hạn!`,
        );
      }
    } catch (error) {
      console.error('❌ [Cronjob] Lỗi khi dọn dẹp hệ thống:', error);
    }
  });

  console.log('⏳ [System] Robot dọn rác (Cronjob) đã được kích hoạt!');
};

export { startCronJobs };
