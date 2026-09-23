import { PrismaClient, Role, SeatType, TicketStatus } from '@prisma/client';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function main() {
  console.log('🌱 (Seeding data)...');

  // 1. DỌN DẸP SẠCH SẼ NHÀ CỬA
  await prisma.ticketSeat.deleteMany();
  await prisma.showtime.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.room.deleteMany();
  await prisma.cinema.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Đã dọn dẹp dữ liệu cũ');

  // 2. TẠO TÀI KHOẢN MẪU (ADMIN & USER)
  const defaultPassword = await bcrypt.hash('123456', 10);

  //Admin
  await prisma.user.create({
    data: {
      email: 'admin@seatify.com',
      password: defaultPassword,
      fullName: 'Admin Seatify',
      role: Role.ADMIN,
      phone: '0901234567',
      birthDay: new Date('1990-01-01'),
    },
  });

  //User
  await prisma.user.create({
    data: {
      email: 'quanghuycv2104@gmail.com',
      password: defaultPassword,
      fullName: 'Khách hàng thân thiết',
      role: Role.USER,
      phone: '0942770374',
      birthDay: new Date('2004-10-22'),
    },
  });
  console.log('👤 Đã tạo User mẫu!');

  // ==========================================
  // 3. TẠO RẠP & PHÒNG CHIẾU (ĐÃ SỬA LỖI Ở ĐÂY)
  // ==========================================
  const cinema = await prisma.cinema.create({
    data: { name: 'Cinestar Quốc Thanh', location: '271 Nguyễn Trãi, Q.1', city: 'Hồ Chí Minh' },
  });

  // Tạo thêm Rạp số 2 để có chỗ nhét room3
  const cinema2 = await prisma.cinema.create({
    data: { name: 'Cinestar Landmark 81', location: 'Vincom Landmark 81', city: 'Hồ Chí Minh' },
  });

  const room1 = await prisma.room.create({
    data: { name: 'Phòng 1 (Standard)', totalSeats: 180, cinemaId: cinema.id },
  });
  const room2 = await prisma.room.create({
    data: { name: 'Phòng 2 (IMAX)', totalSeats: 180, cinemaId: cinema.id },
  });
  const room3 = await prisma.room.create({
    data: { name: 'Phòng 1 (VIP)', totalSeats: 180, cinemaId: cinema2.id },
  });

  console.log('🏢 Đã tạo Rạp và Phòng chiếu');

  // 4. THUẬT TOÁN TẠO SƠ ĐỒ GHẾ HÀNG LOẠT (180 ghế)
  const seatData = [];
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const allRooms = [room1, room2, room3];

  for (const room of allRooms) {
    for (const row of rows) {
      for (let number = 1; number <= 18; number++) {
        let type: SeatType = SeatType.NORMAL;
        if (['D', 'E', 'F', 'G', 'H', 'I'].includes(row)) type = SeatType.VIP;
        if (['J'].includes(row)) type = SeatType.COUPLE;

        seatData.push({
          roomId: room.id,
          row: row,
          number: number,
          type: type,
        });
      }
    }
  }

  await prisma.seat.createMany({ data: seatData });
  console.log(`💺 Đã tự động sinh ra ${seatData.length} ghế vật lý cho tất cả các phòng`);

  // ==========================================
  // 5. TẠO DỮ LIỆU PHIM MẪU
  // ==========================================
  // --- THUẬT TOÁN NGÀY TƯƠNG ĐỐI ---

  const today = new Date();

  // Phim Đang chiếu: Ra mắt 5 ngày trước, kết thúc 15 ngày sau
  const nowPlayingStart = new Date(today);
  nowPlayingStart.setDate(today.getDate() - 5);
  const nowPlayingEnd = new Date(today);
  nowPlayingEnd.setDate(today.getDate() + 15);

  // Phim Sắp chiếu: Ra mắt 10 ngày sau, kết thúc 30 ngày sau
  const comingSoonStart = new Date(today);
  comingSoonStart.setDate(today.getDate() + 10);
  const comingSoonEnd = new Date(today);
  comingSoonEnd.setDate(today.getDate() + 30);

  // Phim Đã gỡ: Ra mắt 60 ngày trước, kết thúc 20 ngày trước
  const archivedStart = new Date(today);
  archivedStart.setDate(today.getDate() - 60);
  const archivedEnd = new Date(today);
  archivedEnd.setDate(today.getDate() - 20);

  // 5. TẠO DỮ LIỆU PHIM MẪU
  await prisma.movie.createMany({
    data: [
      // ================= PHIM ĐANG CHIẾU =================
      {
        title: 'Inside Out 2',
        trailerUrl: 'https://www.youtube.com/watch?v=LEjhY15eCx0',
        posterUrl: 'https://m.media-amazon.com/images/I/81do41OmwiL.jpg',
        backdropUrl:
          'https://www.realmomofsfv.com/wp-content/uploads/2024/09/Inside-Out-2-Digital-2-Banner.png',
        description:
          'Đã hai năm kể từ những sự kiện trong phần phim đầu tiên, giờ đây, những cảm xúc của Riley đang vui vẻ chăm sóc cô trong một trận đấu khúc côn cầu và chuẩn bị cho cô thiếu niên bước vào trung học. Nhưng trung tâm điều khiển của cô lại trải qua một cuộc phá dỡ đột ngột để nhường chỗ cho những Cảm xúc mới đầy bất ngờ! Joy, Sadness, Anger, Fear, và Disgust, những người từ lâu đã điều hành một chiến dịch thành công, không biết phải cảm thấy thế nào khi Anxiety (Lo Âu) xuất hiện và cô ấy dường như không đến một mình.',
        filmGenres: 'Hoạt hình, Hài, Tâm lý',
        duration: 96,
        ageRating: 'P',
        director: 'Kelsey Mann',
        cast: 'Amy Poehler, Maya Hawke',
        country: 'Hoa Kỳ',
        language: 'Lồng tiếng Việt',
        releaseDate: nowPlayingStart,
        endDate: nowPlayingEnd,
      },
      {
        title: 'Nhà Bà Nữ',
        trailerUrl: 'https://www.youtube.com/watch?v=IkaP0KJWTsQ',
        posterUrl:
          'https://cdn-i.doisongphapluat.com.vn/media/dang-nhat-duy/2022/12/03/poster-phim-tran-thanh-nha-ba-nu-dspl-31220221.jpg',
        backdropUrl:
          'https://static2.vieon.vn/vieplay-image/thumbnail_big_v4_ntc/2025/12/22/0c18rjie_nhabanu_1920x1080_nott_1267_712.jpg',
        description:
          'Bộ phim khắc họa tỉ mỉ một gia đình truyền thống Á Đông với ba thế hệ cùng chung sống, xoay quanh bà Nữ - người bán bánh canh cua khét tiếng. Bà Ngọc Nữ trở nên khắt khe với các thành viên trong gia đình, khiến mọi người không có được khoảng thời gian bình yên. Bất ổn trong gia đình leo thang khi bà Nữ biết được con gái út Ngọc Nhi đang yêu. Mâu thuẫn chính bùng nổ khi Nhi quyết định đi theo tình yêu đời mình, tạo nên câu chuyện đời thường nhưng sâu sắc về mâu thuẫn thế hệ.',
        filmGenres: 'Tâm lý, Gia đình',
        duration: 120,
        ageRating: 'T16',
        director: 'Trấn Thành',
        cast: 'Lê Giang, Uyển Ân, Trấn Thành, Khả Như',
        country: 'Việt Nam',
        language: 'Tiếng Việt',
        releaseDate: nowPlayingStart,
        endDate: nowPlayingEnd,
      },
      {
        title: 'Oppenheimer',
        trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
        posterUrl:
          'https://www.tallengestore.com/cdn/shop/products/Oppenheimer-CillianMurphy-ChristopherNolan-HollywoodMoviePoster_5aaacf8f-5d5d-4728-8869-0192bd4e1d9a.jpg?v=1691369039',
        backdropUrl:
          'https://images.squarespace-cdn.com/content/v1/5d781378751c4a68f33aecfc/1690454948409-LS94DMCQKQVAIZVQP2OH/facebook-banner.jpg?format=2500w',
        description:
          'Câu chuyện sử thi về J. Robert Oppenheimer, người đóng vai trò then chốt trong việc phát triển bom nguyên tử với tư cách là giám đốc Phòng thí nghiệm Los Alamos. Phim đan xen giữa quá trình chế tạo vũ khí với những cuộc điều trần chính phủ vào thập niên 1950, nơi Oppenheimer phải bảo vệ lòng trung thành của mình. Tác phẩm khắc họa sâu sắc những xung đột đạo đức và sự giằng xé nội tâm của một nhà khoa học trước sức mạnh hủy diệt mà ông đã tạo ra.',
        filmGenres: 'Tâm lý, Lịch sử',
        duration: 180,
        ageRating: 'T18',
        director: 'Christopher Nolan',
        cast: 'Cillian Murphy, Robert Downey Jr., Emily Blunt',
        country: 'Hoa Kỳ',
        language: 'Phụ đề Tiếng Việt',
        releaseDate: nowPlayingStart,
        endDate: nowPlayingEnd,
      },
      {
        title: 'Kung Fu Panda 4',
        trailerUrl: 'https://www.youtube.com/watch?v=_inKs4eeHiI',
        posterUrl: 'https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg',
        backdropUrl:
          'https://www.showtimeattractions.com.au/wp-content/uploads/KFP4-1100x390-banner.jpg',
        description:
          'Chú gấu trúc Po, giờ đây là một bậc thầy kung fu tài năng, phải đối mặt với một kẻ thù mới nguy hiểm có khả năng biến hình. Trong hành trình này, Po phải đối mặt với quá khứ và đặt câu hỏi về danh tính thực sự của mình, đồng thời tìm kiếm người kế vị xứng đáng cho ngôi vị Thần Long Đại Hiệp. Bộ phim mang đến những pha hành động mãn nhãn kết hợp với thông điệp ý nghĩa về sự trưởng thành và trách nhiệm.',
        filmGenres: 'Hoạt hình, Hài, Gia đình',
        duration: 94,
        ageRating: 'P',
        director: 'Mike Mitchell',
        cast: 'Jack Black, Awkwafina',
        country: 'Hoa Kỳ',
        language: 'Lồng tiếng Việt',
        releaseDate: nowPlayingStart,
        endDate: nowPlayingEnd,
      },
      {
        title: 'Mật Vụ Ong',
        trailerUrl: 'https://www.youtube.com/watch?v=SzINZZ6iqxY',
        posterUrl: 'https://image.tmdb.org/t/p/original/A7EByudX0eOzlkQ2FIbogzyazm2.jpg',
        backdropUrl:
          'https://cdn-media.sforum.vn/storage/app/media/wp-content/uploads/2024/01/mat-vu-ong-thumbnail.jpg',
        description:
          'Adam Clay là một sát thủ đã nghỉ hưu, từng thuộc tổ chức tình báo bí mật "The Beekeepers", hiện sống tĩnh lặng với nghề nuôi ong. Hành trình trả thù đẫm máu bắt đầu khi người chủ nhà tốt bụng của ông, Eloise Parker, rơi vào bẫy lừa đảo khiến bà mất toàn bộ tiền tiết kiệm và dẫn đến tự sát. Đối mặt với những kẻ cầm đầu được bảo vệ bởi lực lượng lính đánh thuê và thậm chí cả sự liên lụy đến giới chức cao cấp, Adam quyết tâm tiêu diệt toàn bộ mạng lưới tội phạm này.',
        filmGenres: 'Hành động, Giật gân',
        duration: 105,
        ageRating: 'T18',
        director: 'David Ayer',
        cast: 'Jason Statham, Josh Hutcherson',
        country: 'Hoa Kỳ',
        language: 'Phụ đề Tiếng Việt',
        releaseDate: nowPlayingStart,
        endDate: nowPlayingEnd,
      },
      {
        title: 'Lật Mặt 7: Một Điều Ước',
        trailerUrl: 'https://www.youtube.com/watch?v=1VbL7E_1gSg',
        posterUrl:
          'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEr4X9oEtYmqSOZFz2qTl22jQ2pvvXXyXVtsSf9ORneLc2P_yYAb01Pto&s=10',
        backdropUrl:
          'https://kenh14cdn.com/203336854389633024/2024/4/29/facebookavatarcopy62b3beb1d-ee48-4863-846a-a2f9b675a79d-1714370044049179847251.jpg',
        description:
          'Nội dung phim tập trung vào một gia đình gồm 5 người con và một người mẹ già sống tại vùng núi Lâm Đồng. Một ngày nọ, người mẹ không may bị tai nạn, ảnh hưởng đến khả năng đi lại. Câu hỏi đầy trăn trở được đặt ra: Trách nhiệm chăm sóc mẹ thuộc về ai trong khi người con nào cũng có gia đình và những mối lo toan riêng?',
        filmGenres: 'Tâm lý, Gia đình',
        duration: 138,
        ageRating: 'P',
        director: 'Lý Hải',
        cast: 'Thanh Hiền, Trương Minh Cường',
        country: 'Việt Nam',
        language: 'Tiếng Việt',
        releaseDate: nowPlayingStart,
        endDate: nowPlayingEnd,
      },
      {
        title: 'Godzilla x Kong: Đế Chế Mới',
        trailerUrl: 'https://www.youtube.com/watch?v=lV1OOlGwExM',
        posterUrl:
          'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/p/m/pm1067intl_excl_3d_1080x1350px_enguk_v2_r1.jpg',
        backdropUrl:
          'https://images2.thanhnien.vn/528068263637045248/2024/2/15/1-1707975462316602481176.png',
        description:
          'Trong cuộc phiêu lưu mới này, Kong khám phá ra một vương quốc chưa từng được biết đến trong Trái Đất Rỗng, nơi có một bộ tộc thuộc giống loài của mình. Tuy nhiên, Kong phải đối mặt với vị vua khỉ độc tài Skar King, kẻ có dã tâm chinh phục thế giới trên mặt đất với sự trợ giúp của Titan Shimo phun băng. Kong buộc phải liên minh một lần nữa với Godzilla để ngăn chặn thảm họa diệt vong đe dọa cả hai thế giới.',
        filmGenres: 'Hành động, Viễn tưởng',
        duration: 115,
        ageRating: 'T13',
        director: 'Adam Wingard',
        cast: 'Rebecca Hall, Brian Tyree Henry',
        country: 'Hoa Kỳ',
        language: 'Phụ đề Tiếng Việt',
        releaseDate: nowPlayingStart,
        endDate: nowPlayingEnd,
      },
      {
        title: 'Mai',
        trailerUrl: 'https://www.youtube.com/watch?v=O112mF4EexY',
        posterUrl:
          'https://cdn-images.vtv.vn/562122370168008704/2023/11/28/photo-1-17011453442011344132442.jpg',
        backdropUrl:
          'https://www.homepaylater.vn/static/fc0abcb71153ebfcde03d85678908601/c579c/00_phim_mai_banner_3e0051cdd7.webp',
        description:
          'Xoay quanh cuộc đời nghiệt ngã của nữ chính tên Mai, sinh ra trong một gia đình bất hạnh với người mẹ bệnh tật và người cha vô tâm. Dù mang nhiều tổn thương trong quá khứ và phải làm nghề mát-xa để mưu sinh, cô luôn cố gắng vượt qua khó khăn để tìm kiếm tình yêu và hạnh phúc. Câu chuyện khắc họa tình yêu trắc trở của Mai và Dương, nơi cô phải lựa chọn giữa hạnh phúc cá nhân và sự hy sinh.',
        filmGenres: 'Tâm lý, Tình cảm',
        duration: 131,
        ageRating: 'T18',
        director: 'Trấn Thành',
        cast: 'Phương Anh Đào, Tuấn Trần',
        country: 'Việt Nam',
        language: 'Tiếng Việt',
        releaseDate: nowPlayingStart,
        endDate: nowPlayingEnd,
      },
      {
        title: 'Dune: Hành Tinh Cát - Phần 2',
        trailerUrl: 'https://www.youtube.com/watch?v=U2Qp5pL3ovA',
        posterUrl:
          'https://upload.wikimedia.org/wikipedia/vi/9/94/Dune_2_VN_poster.jpg?utm_source=vi.wikipedia.org&utm_campaign=index&utm_content=original',
        backdropUrl:
          'https://cdn-media.sforum.vn/storage/app/media/wp-content/uploads/2023/10/dune-hanh-tinh-cat-2023-thumb.jpg',
        description:
          'Trong phần hai này, Paul Atreides liên minh với Chani và tộc người Fremen dũng mãnh, khát khao trả thù những kẻ đã mang lại sự hủy diệt cho gia tộc mình. Bị giằng xé giữa tình yêu mãnh liệt với Chani và vận mệnh của vũ trụ, Paul phải đối mặt với một ngã rẽ đầy thử thách. Gánh vác lời tiên tri trên vai, anh dấn thân vào một hành trình nguy hiểm để tạo dựng vận mệnh mới và ngăn chặn viễn cảnh tận thế mà chỉ mình anh thấy được.',
        filmGenres: 'Hành động, Viễn tưởng',
        duration: 166,
        ageRating: 'T16',
        director: 'Denis Villeneuve',
        cast: 'Timothée Chalamet, Zendaya',
        country: 'Hoa Kỳ',
        language: 'Phụ đề Tiếng Việt',
        releaseDate: nowPlayingStart,
        endDate: nowPlayingEnd,
      },

      // ================= PHIM SẮP CHIẾU =================
      {
        title: 'Avatar: Fire and Ash',
        trailerUrl: 'https://www.youtube.com/watch?v=nb_fFj_0rq8',
        posterUrl:
          'https://m.media-amazon.com/images/M/MV5BZDYxY2I1OGMtN2Y4MS00ZmU1LTgyNDAtODA0MzAyYjI0N2Y2XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg',
        backdropUrl: 'https://coolmusicltd.com/wp-content/uploads/2025/07/Avatar.jpeg',
        description:
          "Gia đình Sully tiếp tục đối mặt với mối đe dọa kết hợp từ lực lượng RDA của loài người và Mangkwan, một gia tộc Na'vi tàn bạo trên hành tinh Pandora. Cuộc chiến sinh tồn bước sang trang mới với những trận chiến khốc liệt trên không và dưới nước, đòi hỏi sự đoàn kết của các bộ tộc và sức mạnh từ thiên nhiên.",
        filmGenres: 'Hành động, Viễn tưởng',
        duration: 197,
        ageRating: 'T13',
        director: 'James Cameron',
        cast: 'Sam Worthington, Zoe Saldaña',
        country: 'Hoa Kỳ',
        language: 'Phụ đề Tiếng Việt',
        releaseDate: comingSoonStart,
        endDate: comingSoonEnd,
      },
      {
        title: 'Avengers: Doomsday',
        trailerUrl: 'https://www.youtube.com/watch?v=irVNGjRFZGk',
        posterUrl:
          'https://preview.redd.it/avengers-doomsday-poster-featuring-the-confirmed-cast-so-v0-b8a68egs9n2f1.jpeg?width=1080&crop=smart&auto=webp&s=084b76fd6c5ce580d9c3a94081595b48137d0314',
        backdropUrl:
          'https://preview.redd.it/fanmade-poster-of-avengers-doomsday-hope-yall-like-it-v0-v5iuhwce8ahd1.jpeg?auto=webp&s=b6c88495fb47e1a7ef2733189ad6d75e0ea5537d',
        description:
          'Mười bốn tháng sau những sự kiện của Thunderbolts*, các nhóm anh hùng từ ba vũ trụ khác nhau hội tụ. The Avengers, Wakandans, và New Avengers từ Trái Đất-616; Fantastic Four từ Trái Đất-828; và X-Men "nguyên bản" từ một vũ trụ riêng biệt phải hợp sức để đối mặt với mối đe dọa hiện hữu mang tên Doctor Doom.',
        filmGenres: 'Hành động, Viễn tưởng',
        duration: 150,
        ageRating: 'T13',
        director: 'The Russo Brothers',
        cast: 'Robert Downey Jr.',
        country: 'Hoa Kỳ',
        language: 'Phụ đề Tiếng Việt',
        releaseDate: comingSoonStart,
        endDate: comingSoonEnd,
      },
      {
        title: 'Mickey 17',
        trailerUrl: 'https://www.youtube.com/watch?v=osYpGSz_0i4',
        posterUrl: 'https://image.tmdb.org/t/p/original/zmNHgN6fQQgXgqqALjjRYtgjiQi.jpg',
        backdropUrl:
          'https://movieswetextedabout.com/wp-content/uploads/2025/03/Mickey-17-Movie-Review.webp',
        description:
          'Lấy bối cảnh năm 2054, một người đàn ông tham gia hành trình thuộc địa không gian với tư cách là một "Kẻ thế mạng" - người lao động bị nhân bản mỗi khi chết đi. Trải qua nhiều lần chết đi sống lại, Mickey 17 vô tình giáp mặt với phiên bản tiếp theo của chính mình, mở ra một cuộc chiến sinh tồn dữ dội chống lại những quy định tàn nhẫn của tổ chức.',
        filmGenres: 'Khoa học viễn tưởng, Tâm lý',
        duration: 138,
        ageRating: 'T18',
        director: 'Bong Joon-ho',
        cast: 'Robert Pattinson',
        country: 'Hoa Kỳ',
        language: 'Phụ đề Tiếng Việt',
        releaseDate: comingSoonStart,
        endDate: comingSoonEnd,
      },
      {
        title: 'Zootopia 2',
        trailerUrl: 'https://www.youtube.com/watch?v=BjkIOU5PhyQ',
        posterUrl: 'https://i.ebayimg.com/images/g/7qwAAOSwDyhgBjDv/s-l1200.jpg',
        backdropUrl: 'https://thedisinsider.com/wp-content/uploads/2021/03/scale-5.jpeg',
        description:
          'Hành trình phá án mới của bộ đôi cảnh sát thỏ Judy Hopps và anh cáo Nick Wilde tại thành phố động vật Zootopia. Phim tiếp tục hé lộ những manh mối rải rác đằng sau các vụ án bí ẩn, hứa hẹn tạo ra những cú "plot twist" đầy bất ngờ.',
        filmGenres: 'Hoạt hình, Hài',
        duration: 100,
        ageRating: 'P',
        director: 'Jared Bush',
        cast: 'Ginnifer Goodwin',
        country: 'Hoa Kỳ',
        language: 'Lồng tiếng Việt',
        releaseDate: comingSoonStart,
        endDate: comingSoonEnd,
      },
      {
        title: 'Deadpool & Wolverine',
        trailerUrl: 'https://www.youtube.com/watch?v=73_1biulkYk',
        posterUrl:
          'https://www.movieposters.com/cdn/shop/files/scan002_00e0a1a8-b4ad-49ff-861f-8dd64ac12a6d_1024x1024.jpg?v=1762977060',
        backdropUrl:
          'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS__A1Dba42OoHby-SIG_yD-8Wkcr8jA7SfrZrfVs8gq3kRcbnkgIp8Z4o&s=10',
        description:
          'Wade Wilson, nay đã lui về ở ẩn, bất ngờ bị Cơ quan Quản lý Phương sai Thời gian (TVA) bắt giữ. Để ngăn chặn vũ trụ của mình bị phá hủy do sự ra đi của nhân tố mấu chốt Logan, Deadpool buộc phải hợp tác với một phiên bản Wolverine miễn cưỡng từ một vũ trụ khác. Cả hai dấn thân vào một cuộc phiêu lưu điên rồ, chống lại Cassandra Nova quyền năng để giải cứu đa vũ trụ.',
        filmGenres: 'Hành động, Hài',
        duration: 127,
        ageRating: 'T18',
        director: 'Shawn Levy',
        cast: 'Ryan Reynolds, Hugh Jackman',
        country: 'Hoa Kỳ',
        language: 'Phụ đề Tiếng Việt',
        releaseDate: comingSoonStart,
        endDate: comingSoonEnd,
      },
      {
        title: 'Kẻ Trộm Mặt Trăng 4',
        trailerUrl: 'https://www.youtube.com/watch?v=qQlr9-rF32A',
        posterUrl:
          'https://cdn.galaxycine.vn/media/2024/6/20/despicable-me-4-500_1718865149847.jpg',
        backdropUrl:
          'https://baodongnai.com.vn/file/e7837c02876411cd0187645a2551379f/072024/14_3_20240704213209.jpg',
        description:
          'Gia đình Gru chào đón một thành viên mới đầy bướng bỉnh: Gru Jr. Cuộc sống yên bình nhanh chóng bị đảo lộn khi Maxime Le Mal, kẻ thù mới của Gru, và bạn gái Valentina xuất hiện. Gia đình Gru buộc phải chạy trốn và đối mặt với những thử thách dở khóc dở cười cùng đội quân Minion quen thuộc.',
        filmGenres: 'Hoạt hình, Hài',
        duration: 95,
        ageRating: 'P',
        director: 'Chris Renaud',
        cast: 'Steve Carell',
        country: 'Hoa Kỳ',
        language: 'Lồng tiếng Việt',
        releaseDate: comingSoonStart,
        endDate: comingSoonEnd,
      },
      {
        title: 'Venom: Kèo Cuối',
        trailerUrl: 'https://www.youtube.com/watch?v=__2bjWbetsA',
        posterUrl: 'https://image.tmdb.org/t/p/w500/aosm8NMQ3UyoBVpSxyimorCQykC.jpg',
        backdropUrl:
          'https://simg.zalopay.com.vn/travel/2024/movie/venom-keo-cuoi-3vGP6pK4zXxH.jpg',
        description:
          'Eddie Brock và symbiote Venom đang trên đường chạy trốn sau khi bị đổ lỗi cho cái chết của Thám tử Pat Mulligan. Đồng thời, Knull - kẻ tạo ra các symbiote, săn lùng một thứ gọi là "codex" ẩn trong cột sống của Eddie. Bị bủa vây từ cả hai thế giới, bộ đôi phải đối mặt với một quyết định tàn khốc trong phần kết hành động kịch tính này.',
        filmGenres: 'Hành động, Viễn tưởng',
        duration: 109,
        ageRating: 'T13',
        director: 'Kelly Marcel',
        cast: 'Tom Hardy',
        country: 'Hoa Kỳ',
        language: 'Phụ đề Tiếng Việt',
        releaseDate: comingSoonStart,
        endDate: comingSoonEnd,
      },

      // ================= PHIM ĐÃ GỠ (ARCHIVED) =================
      {
        title: 'Avatar: Dòng Chảy Của Nước',
        trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
        posterUrl:
          'https://upload.wikimedia.org/wikipedia/vi/e/e0/Avatar_D%C3%B2ng_ch%E1%BA%A3y_c%E1%BB%A7a_n%C6%B0%E1%BB%9Bc_-_Poster_ch%C3%ADnh_th%E1%BB%A9c.jpg?utm_source=vi.wikipedia.org&utm_campaign=index&utm_content=original',
        backdropUrl:
          'https://simg.zalopay.com.vn/travel/2025/movie/chieu-lai-avatar-dong-chay-cua-nuoc-mA7EkH0TSjTf.jpg',
        description:
          "Người Na'vi Jake Sully và gia đình tìm nơi ẩn náu với tộc Metkayina ở miền biển của Pandora. Tuy nhiên, cuộc sống yên bình không kéo dài khi mối đe dọa cũ từ con người quay trở lại. Gia đình Sully cùng tộc Metkayina phải kề vai sát cánh chiến đấu để bảo vệ vùng biển xinh đẹp trước những cỗ máy chiến tranh tàn nhẫn.",
        filmGenres: 'Hành động, Phiêu lưu',
        duration: 192,
        ageRating: 'T13',
        director: 'James Cameron',
        cast: 'Sam Worthington, Zoe Saldaña',
        country: 'Hoa Kỳ',
        language: 'Phụ đề Tiếng Việt',
        releaseDate: archivedStart,
        endDate: archivedEnd,
      },
    ],
  });
  console.log('🎬 Đã thêm phim mẫu vào kho với mô tả chi tiết');

  // ==========================================
  // 6. SUẤT CHIẾU & MÁY IN VÉ (DYNAMIC)
  // ==========================================
  // Lấy ra toàn bộ phim ĐANG CHIẾU để rải suất chiếu
  const nowPlayingMovies = await prisma.movie.findMany({
    where: {
      releaseDate: { lte: today },
      endDate: { gte: today },
    },
  });

  if (nowPlayingMovies.length > 0) {
    const day0 = new Date(today);
    const day1 = new Date(today);
    day1.setDate(today.getDate() + 1);
    const day2 = new Date(today);
    day2.setDate(today.getDate() + 2);

    const createTime = (dateBase: Date, hourVN: number, minVN: number) => {
      const d = new Date(dateBase);
      d.setUTCHours(hourVN - 7, minVN, 0, 0); // Convert VN time to UTC
      return d;
    };

    //Khuôn Suất Chiếu
    interface ShowtimeSeed {
      movieId: string;
      roomId: string;
      start: Date;
      end: Date;
    }

    const showtimesData: ShowtimeSeed[] = [];

    // Rải suất chiếu ngẫu nhiên cho tất cả các phim đang chiếu trên các ngày và các phòng
    const days = [day0, day1, day2];
    const rooms = [room1, room2, room3];

    // Một số khung giờ chiếu cố định trong ngày
    const timeSlots = [
      { startH: 9, startM: 0, endH: 11, endM: 30 },
      { startH: 12, startM: 0, endH: 14, endM: 30 },
      { startH: 15, startM: 0, endH: 17, endM: 30 },
      { startH: 18, startM: 0, endH: 20, endM: 30 },
      { startH: 21, startM: 0, endH: 23, endM: 30 },
    ];

    for (const movie of nowPlayingMovies) {
      for (const day of days) {
        // Mỗi phim chiếu 2-3 suất mỗi ngày ngẫu nhiên ở các phòng khác nhau
        const numShowings = Math.floor(Math.random() * 2) + 2; // 2 or 3 showings
        const shuffledSlots = [...timeSlots].sort(() => 0.5 - Math.random()).slice(0, numShowings);

        for (const slot of shuffledSlots) {
          const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
          showtimesData.push({
            movieId: movie.id,
            roomId: randomRoom.id,
            start: createTime(day, slot.startH, slot.startM),
            end: createTime(day, slot.endH, slot.endM),
          });
        }
      }
    }

    console.log('\n⚙️ Đang lên lịch chiếu và in vé...');

    for (const st of showtimesData) {
      const showtime = await prisma.showtime.create({
        data: { movieId: st.movieId, roomId: st.roomId, startTime: st.start, endTime: st.end },
      });

      const physicalSeats = await prisma.seat.findMany({ where: { roomId: st.roomId } });

      // Giả lập lượng vé đã bán ngẫu nhiên từ 10% đến 40% số ghế
      const numBooked = Math.floor(Math.random() * 50) + 18;
      const mockBookedIndices = Array.from({ length: physicalSeats.length }, (_, i) => i)
        .sort(() => 0.5 - Math.random())
        .slice(0, numBooked);

      const ticketSeatData = physicalSeats.map((seat, index) => {
        return {
          showtimeId: showtime.id,
          seatId: seat.id,
          price: seat.type === 'VIP' ? 20000 : seat.type === 'COUPLE' ? 25000 : 0,
          // ĐÃ VÁ LỖI: Sử dụng thẳng Enum của Prisma, xóa sạch dấu vết của 'any' và string thô!
          status: mockBookedIndices.includes(index) ? TicketStatus.BOOKED : TicketStatus.AVAILABLE,
        };
      });

      await prisma.ticketSeat.createMany({ data: ticketSeatData });
    }
    console.log(
      `🎟️ Đã tạo ra ${showtimesData.length} suất chiếu và in hàng ngàn vé cho TẤT CẢ các phim đang chiếu`,
    );
  }

  console.log('✅ HOÀN TẤT QUÁ TRÌNH SEEDING DATA');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
