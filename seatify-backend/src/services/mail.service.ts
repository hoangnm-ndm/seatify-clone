import nodemailer from 'nodemailer';

// --- KHUÔN DỮ LIỆU DÀNH CHO BƯU TÁ ---
interface TicketSeatMail {
  seat: {
    row: string;
    number: number;
  };
  showtime: {
    startTime: Date | string;
    movie: { title: string };
    room: {
      name: string;
      cinema: { name: string };
    };
  };
}

interface BookingMailData {
  id: string;
  guestName: string | null;
  totalPrice: number;
  ticketSeats: TicketSeatMail[];
}

// Khởi tạo Bưu tá với tài khoản Gmail của bạn
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true cho cổng 465, false cho cổng 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // Vượt qua bộ lọc SSL của phần mềm diệt virus cục bộ
    rejectUnauthorized: false,
  },
});

const sendTicketEmail = async (customerEmail: string, bookingData: BookingMailData) => {
  try {
    const ticketSeats = bookingData.ticketSeats;
    const showtime = ticketSeats[0].showtime;

    // Bỏ chữ ': any' ở ts đi vì TypeScript giờ đã tự hiểu ts là TicketSeatMail
    const seatNames = ticketSeats.map((ts) => `${ts.seat.row}${ts.seat.number}`).join(', ');
    const startTime = new Date(showtime.startTime);

    const formattedDate = startTime.toLocaleDateString('vi-VN');
    const formattedTime = startTime.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Dùng API của Google để sinh QR, đảm bảo Gmail không chặn hình ảnh QR
    const qrCodeUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${bookingData.id}&choe=UTF-8`;

    // Giao diện Email HTML Premium (Dark Mode)
    const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; padding: 40px 10px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
        
        <!-- Header Vàng Đồng -->
        <div style="background-color: #f59e0b; padding: 25px; text-align: center;">
          <h1 style="color: #0f172a; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px;">SEATIFY CINEMA</h1>
          <p style="color: #0f172a; margin: 5px 0 0 0; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Vé Điện Tử (E-Ticket)</p>
        </div>

        <!-- Nội dung chính (Nền xanh đen) -->
        <div style="padding: 30px; color: #cbd5e1;">
          <p style="font-size: 16px; color: #f8fafc; margin-bottom: 20px;">Xin chào <strong style="color: #f59e0b;">${bookingData.guestName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6;">Cảm ơn bạn đã lựa chọn Seatify. Vui lòng xuất trình Mã QR này tại quầy soát vé hoặc đưa vào máy quét tự động để vào rạp.</p>

          <!-- Khu vực Mã QR -->
          <div style="text-align: center; margin: 40px 0; padding: 20px; background-color: #1e293b; border-radius: 12px; border: 1px dashed #334155;">
            <div style="background-color: white; display: inline-block; padding: 15px; border-radius: 8px;">
              <img src="${qrCodeUrl}" alt="QR Code" style="display: block; width: 150px; height: 150px;" />
            </div>
            <p style="font-family: monospace; font-size: 14px; color: #94a3b8; margin-top: 15px; letter-spacing: 1px;">MÃ ĐƠN: <strong>${bookingData.id.split('-')[0].toUpperCase()}</strong></p>
          </div>

          <!-- Khối Thông tin Phim -->
          <div style="background-color: #1e293b; padding: 25px; border-radius: 12px; border-left: 4px solid #f59e0b;">
            <h2 style="color: #f8fafc; margin: 0 0 15px 0; font-size: 20px; text-transform: uppercase;">${showtime.movie.title}</h2>
            
            <table style="width: 100%; font-size: 14px; line-height: 1.8; color: #cbd5e1;" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width: 100px; padding-bottom: 8px;"><strong>Cụm Rạp:</strong></td>
                <td style="padding-bottom: 8px; color: #f8fafc;">${showtime.room.cinema.name}</td>
              </tr>
              <tr>
                <td style="padding-bottom: 8px;"><strong>Phòng:</strong></td>
                <td style="padding-bottom: 8px; color: #f8fafc;">${showtime.room.name}</td>
              </tr>
              <tr>
                <td style="padding-bottom: 8px;"><strong>Thời gian:</strong></td>
                <td style="padding-bottom: 8px;"><strong style="color: #f59e0b; font-size: 16px;">${formattedTime}</strong> - ${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding-bottom: 8px;"><strong>Ghế chọn:</strong></td>
                <td style="padding-bottom: 8px;"><strong style="color: #f59e0b; font-size: 18px;">${seatNames}</strong></td>
              </tr>
            </table>
          </div>

          <!-- Tổng tiền -->
          <div style="margin-top: 25px; text-align: right; border-top: 1px dashed #334155; padding-top: 20px;">
            <p style="margin: 0; font-size: 14px; color: #94a3b8;">Tổng thanh toán</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 900; color: #10b981;">${bookingData.totalPrice.toLocaleString('vi-VN')} VNĐ</p>
          </div>
        </div>

        <!-- Footer Email -->
        <div style="background-color: #020617; padding: 20px; text-align: center; border-top: 1px solid #1e293b;">
          <p style="margin: 0; font-size: 12px; color: #64748b;">© 2026 Seatify Cinema. All rights reserved.</p>
          <p style="margin: 5px 0 0 0; font-size: 11px; color: #475569;">Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
        
      </div>
    </div>`;

    // Ra lệnh gửi mail
    await transporter.sendMail({
      from: `"Seatify Ticket" <${process.env.EMAIL_USER}>`,
      to: customerEmail,
      subject: `[Seatify] Vé Điện Tử - Phim ${showtime.movie.title}`,
      html: htmlContent,
    });

    console.log(`📧 Đã gửi vé điện tử tới email: ${customerEmail}`);
  } catch (error) {
    console.error('❌ Lỗi gửi email:', error);
  }
};

export { sendTicketEmail };
