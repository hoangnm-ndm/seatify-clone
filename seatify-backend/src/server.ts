import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rootRouter from './routes/index';
import { startCronJobs } from './services/cron.service';

// Nạp biến môi trường từ file .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// app.use(cors()); // Cho phép Frontend gọi API không bị chặn
app.use(
  cors({
    origin: ['http://localhost:5173', process.env.FRONTEND_URL as string],
    credentials: true,
  }),
);
app.use(express.json()); // Cho phép Backend đọc data JSON từ Client gửi lên

// Route cơ bản để test
app.get('/', (req: Request, res: Response) => {
  res.send('Chào mừng đến với API Backend của Seatify!');
});

app.use('/api', rootRouter);

startCronJobs();

app.listen(PORT, () => {
  console.log(`Server Seatify đang chạy thành công tại http://localhost:${PORT}`);
});
