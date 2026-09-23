import { Play, Ticket, Clock, Globe, MessageCircle, Tags } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface MovieCardProps {
  id: string | number;
  title: string;
  genre: string;
  posterUrl: string;
  ageRating: string;
  duration?: number;
  country?: string;
  language?: string;
  trailerUrl?: string;
  onPlayTrailer?: (url: string) => void;
}

const MovieCard = ({
  id,
  title,
  genre,
  posterUrl,
  ageRating,
  duration,
  country,
  language,
  trailerUrl,
  onPlayTrailer,
}: MovieCardProps) => {
  return (
    <Link to={`/movies/${id}`} className="flex flex-col gap-4 group">
      {/* 1. KHU VỰC POSTER */}
      <div className="relative rounded-2xl overflow-hidden cursor-pointer bg-slate-800 aspect-[2/3] w-full shadow-lg">
        {/* Ảnh Poster */}
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Tag Độ tuổi */}
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-black px-2 py-1 rounded shadow-md z-10">
          {ageRating}
        </div>

        {/* LỚP PHỦ HOVER */}
        <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center p-6 backdrop-blur-sm z-20">
          <h3 className="font-black text-xl text-white mb-6 uppercase leading-tight border-b border-slate-700 pb-4">
            {title}
          </h3>

          <ul className="space-y-4 text-sm text-slate-300 font-medium">
            <li className="flex items-center gap-3">
              <Tags className="w-5 h-5 text-amber-500" />
              <span className="line-clamp-1">{genre}</span>
            </li>
            <li className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>{duration} Phút</span>
            </li>
            <li className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-amber-500" />
              <span>{country || 'Đang cập nhật'}</span>
            </li>
            <li className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-amber-500" />
              <span>{language || 'Đang cập nhật'}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 2. KHU VỰC THÔNG TIN & NÚT BẤM  */}
      <div className="flex flex-col gap-3">
        {/* Tên phim */}
        <h3 className="font-bold text-lg text-slate-200 uppercase text-center line-clamp-1 group-hover:text-amber-500 transition-colors cursor-pointer">
          {title}
        </h3>

        {/* 2 Nút bấm */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={(e) => {
              e.preventDefault(); // CHẶN LỆNH CHUYỂN TRANG CỦA THẺ LINK!
              if (onPlayTrailer && trailerUrl) onPlayTrailer(trailerUrl);
              else toast.error('Trailer đang được cập nhật!');
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4" /> Trailer
          </button>

          <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-md">
            <Ticket className="w-4 h-4" /> Đặt Vé
          </button>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
