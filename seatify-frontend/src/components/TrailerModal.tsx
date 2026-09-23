import { X } from 'lucide-react';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string | null;
}

const TrailerModal = ({ isOpen, onClose, videoUrl }: TrailerModalProps) => {
  if (!isOpen) return null;

  // Xử lý link YouTube để lấy ID video (Vì thẻ iframe cần link dạng /embed/ID)
  // Ví dụ link: https://www.youtube.com/watch?v=TcMBFSGVi1c
  const getEmbedUrl = (url: string | null) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : '';
  };

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      {/* Khung chứa Video */}
      <div className="bg-black border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl relative overflow-hidden transform transition-all aspect-video">
        {/* Nút Đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-red-500 transition-colors cursor-pointer z-10 p-2 bg-black/50 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Trình phát Video YouTube */}
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="Movie Trailer"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            Trailer đang được cập nhật...
          </div>
        )}
      </div>
    </div>
  );
};

export default TrailerModal;
