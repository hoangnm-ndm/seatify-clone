import { PrismaClient, Prisma, TicketStatus } from '@prisma/client';

const prisma = new PrismaClient();

const getShowtimes = async (movieId: string, cinemaId: string | undefined, dateString: string) => {
  const startDate = new Date(dateString);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 1);

  // 1. Tạo hộp điều kiện linh hoạt
  const whereCondition: Prisma.ShowtimeWhereInput = {
    movieId: movieId,
    startTime: {
      gte: startDate,
      lt: endDate,
    },
  };

  // Nếu khách có truyền cinemaId thì mới nhét thêm điều kiện lọc rạp vào hộp
  if (cinemaId) {
    whereCondition.room = { cinemaId: cinemaId };
  }

  const showtimes = await prisma.showtime.findMany({
    where: whereCondition, // Thả hộp điều kiện vào đây
    orderBy: { startTime: 'asc' },
    include: {
      // 2. PHÉP MÀU CỦA PRISMA: JOIN LỒNG NHAU (Lấy Suất chiếu -> Lấy Phòng -> Lấy luôn Tên Rạp)
      room: {
        include: { cinema: true },
      },
      _count: {
        select: {
          ticketSeats: {
            where: { status: { in: ['HOLDING', 'BOOKED'] } },
          },
        },
      },
    },
  });

  const result = showtimes.map((st) => {
    const soldSeats = st._count.ticketSeats;
    const totalSeats = st.room.totalSeats;

    return {
      id: st.id,
      startTime: st.startTime,
      roomName: st.room.name,
      cinemaName: st.room.cinema.name, // Lấy tên rạp
      cinemaAddress: st.room.cinema.location, // Lấy địa chỉ rạp
      totalSeats: totalSeats,
      soldSeats: soldSeats,
      isFull: soldSeats >= totalSeats,
    };
  });

  return result;
};

// Hàm lấy danh sách ghế ĐÃ BÁN hoặc ĐANG GIỮ CHỖ của 1 suất chiếu
const getBookedSeats = async (showtimeId: string) => {
  // 1. Tìm các vé (TicketSeat) của suất chiếu này
  const ticketSeats = await prisma.ticketSeat.findMany({
    where: {
      showtimeId: showtimeId,
      status: {
        in: ['BOOKED', 'HOLDING'], // Chỉ lấy vé đã bán hoặc đang bị người khác giữ
      },
    },
    // JOIN sang bảng Seat vật lý để lấy cái 'row' (A) và 'number' (1)
    include: {
      seat: true,
    },
  });

  // 2. Ép kiểu dữ liệu (Mapping)
  // Biến mảng Object rườm rà thành một mảng chuỗi đơn giản: ['A1', 'B2', 'C3']
  const bookedSeatIds = ticketSeats.map((ts) => {
    return `${ts.seat.row}${ts.seat.number}`;
  });

  return bookedSeatIds;
};

const getShowtimeById = async (id: string) => {
  const showtime = await prisma.showtime.findUnique({
    where: { id: id },
    include: {
      movie: true, // Lấy tên phim
      room: {
        include: { cinema: true }, // Lấy tên phòng và tên rạp
      },
    },
  });

  if (!showtime) throw new Error('Không tìm thấy suất chiếu này!');
  return showtime;
};

//Admin CRUD
const createShowtime = async (
  movieId: string,
  roomId: string,
  startTime: string,
  endTime: string,
) => {
  // BỌC TRONG TRANSACTION: Phải tạo thành công cả Suất Chiếu lẫn 180 cái Vé thì mới lưu!
  return await prisma.$transaction(async (tx) => {
    // 1. TẠO SUẤT CHIẾU
    const newShowtime = await tx.showtime.create({
      data: {
        movieId,
        roomId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });

    // 2. LẤY DANH SÁCH GHẾ VẬT LÝ CỦA PHÒNG CHIẾU NÀY
    const physicalSeats = await tx.seat.findMany({
      where: { roomId: roomId },
    });

    if (physicalSeats.length === 0) {
      throw new Error('Phòng chiếu này chưa có ghế vật lý nào được thiết lập!');
    }

    // 3. THUẬT TOÁN "MÁY IN VÉ" (Biến Ghế thành Vé)
    const ticketSeatData = physicalSeats.map((seat) => {
      // Chỉ lưu TIỀN PHỤ THU (Surcharge) của ghế vào vé này
      // (Vì ta chưa biết khách mua là Người lớn hay HSSV)
      let surcharge = 0; // Ghế thường phụ thu 0đ
      if (seat.type === 'VIP') surcharge = 20000; // VIP phụ thu 20k
      if (seat.type === 'COUPLE') surcharge = 25000; // Couple phụ thu 25k/ghế

      return {
        showtimeId: newShowtime.id,
        seatId: seat.id,
        price: surcharge, // Lưu tiền phụ thu vào đây
        status: TicketStatus.AVAILABLE,
      };
    });

    // 4. BULK INSERT (Bắn 180 vé xuống DB trong 1 câu lệnh duy nhất)
    await tx.ticketSeat.createMany({
      data: ticketSeatData,
    });

    return newShowtime;
  });
};

export { getShowtimes, getBookedSeats, getShowtimeById, createShowtime };
