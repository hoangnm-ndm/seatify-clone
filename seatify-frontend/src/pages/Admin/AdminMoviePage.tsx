import { useState, useEffect } from 'react';
import { Film, Plus, X, Loader2, Edit } from 'lucide-react'; // Thêm icon Edit
import { fetchClient } from '../../utils/apiClient';
import { toast } from 'sonner';

interface Movie {
  id: string;
  title: string;
  posterUrl: string;
  duration: number;
  ageRating: string;
  status: string;
  trailerUrl?: string;
  filmGenres?: string;
  director?: string;
  cast?: string;
  country?: string;
  language?: string;
  releaseDate?: string;
  endDate?: string;
  description?: string;
}

const AdminMoviesPage = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // LOGIC SỬA PHIM: Dùng để phân biệt form đang Thêm hay Sửa
  const [editingId, setEditingId] = useState<string | null>(null);

  // Đã bổ sung trường endDate vào Form
  const [formData, setFormData] = useState({
    title: '',
    posterUrl: '',
    trailerUrl: '',
    duration: '',
    ageRating: 'T18', // Default T18
    status: 'COMING_SOON',
    filmGenres: '',
    director: '',
    cast: '',
    country: 'Việt Nam',
    language: 'Phụ đề Tiếng Việt',
    releaseDate: '',
    endDate: '',
    description: '',
  });

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetchClient('/movies');
        setMovies(res.data);
      } catch {
        toast.error('Lỗi khi tải danh sách phim!');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMovies();
  }, [refreshKey]);

  // HÀM: Bấm nút Thêm Mới
  const handleAddNew = () => {
    setEditingId(null); // Không có ID => Là Thêm mới
    setFormData({
      title: '',
      posterUrl: '',
      trailerUrl: '',
      duration: '',
      ageRating: 'T18',
      status: 'COMING_SOON',
      filmGenres: '',
      director: '',
      cast: '',
      country: 'Việt Nam',
      language: 'Phụ đề Tiếng Việt',
      releaseDate: '',
      endDate: '',
      description: '',
    });
    setIsModalOpen(true);
  };

  // HÀM: Bấm nút Sửa phim (Fill data vào form)
  const handleEdit = (movie: Movie) => {
    setEditingId(movie.id); // Có ID => Là Sửa
    setFormData({
      title: movie.title,
      posterUrl: movie.posterUrl || '',
      trailerUrl: movie.trailerUrl || '',
      duration: movie.duration.toString(),
      ageRating: movie.ageRating,
      status: movie.status,
      filmGenres: movie.filmGenres || '',
      director: movie.director || '',
      cast: movie.cast || '',
      country: movie.country || '',
      language: movie.language || '',
      // Xử lý cắt chuỗi ngày tháng để gắn vào thẻ <input type="date">
      releaseDate: movie.releaseDate ? movie.releaseDate.split('T')[0] : '',
      endDate: movie.endDate ? movie.endDate.split('T')[0] : '',
      description: movie.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.duration || !formData.posterUrl) {
      return toast.error('Vui lòng nhập Tên phim, Thời lượng và Link Poster!');
    }

    try {
      setIsSubmitting(true);

      // KIỂM TRA: Nếu có editingId thì gọi PUT, nếu không thì gọi POST
      if (editingId) {
        await fetchClient(`/movies/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        toast.success('Đã cập nhật thông tin phim thành công!');
      } else {
        await fetchClient('/movies', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        toast.success('Đã thêm phim mới thành công!');
      }

      setIsModalOpen(false);
      setRefreshKey((prev) => prev + 1); // Load lại bảng
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 border-b-2 border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Film className="w-8 h-8 text-amber-500" />
          <h1 className="text-3xl font-black text-white uppercase tracking-wider">Quản Lý Phim</h1>
        </div>
        <button
          onClick={handleAddNew} // Gọi hàm thêm mới
          className="flex items-center gap-2 bg-amber-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Thêm Phim Mới
        </button>
      </div>

      {/* BẢNG DANH SÁCH PHIM */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-amber-500 font-bold animate-pulse">
            Đang tải dữ liệu...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-bold">Tên Phim</th>
                  <th className="p-4 font-bold">Thời Lượng</th>
                  <th className="p-4 font-bold">Phân Loại</th>
                  <th className="p-4 font-bold">Trạng Thái</th>
                  <th className="p-4 font-bold text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-300">
                {movies.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4 font-bold text-white flex items-center gap-3">
                      <img
                        src={m.posterUrl}
                        alt="poster"
                        className="w-10 h-14 object-cover rounded"
                      />
                      {m.title}
                    </td>
                    <td className="p-4">{m.duration} phút</td>
                    <td className="p-4">
                      <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded font-bold">
                        {m.ageRating}
                      </span>
                    </td>
                    <td className="p-4">
                      {m.status === 'NOW_PLAYING' && (
                        <span className="text-green-500 font-bold">Đang chiếu</span>
                      )}
                      {m.status === 'COMING_SOON' && (
                        <span className="text-amber-500 font-bold">Sắp chiếu</span>
                      )}
                      {m.status === 'ARCHIVED' && (
                        <span className="text-slate-500 font-bold">Đã gỡ</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleEdit(m)} // NÚT SỬA PHIM
                        className="p-2 bg-slate-800 text-slate-300 hover:bg-amber-500 hover:text-slate-950 rounded-lg transition-colors cursor-pointer"
                        title="Sửa phim"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL THÊM / SỬA PHIM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-4xl relative overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-950/50">
              {/* Đổi tiêu đề dựa theo trạng thái Thêm hay Sửa */}
              <h2 className="text-2xl font-black text-amber-500 uppercase tracking-wider">
                {editingId ? 'Cập Nhật Phim' : 'Thêm Phim Mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 bg-slate-800/50 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="movieForm" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Tên phim *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-amber-500 outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Thời lượng (Phút) *</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-amber-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Đạo diễn</label>
                    <input
                      type="text"
                      value={formData.director}
                      onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Diễn viên chính</label>
                    <input
                      type="text"
                      value={formData.cast}
                      onChange={(e) => setFormData({ ...formData, cast: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Link Ảnh Poster *</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={formData.posterUrl}
                      onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-amber-500 outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Link YouTube Trailer</label>
                    <input
                      type="text"
                      placeholder="https://youtube.com/watch?v=..."
                      value={formData.trailerUrl}
                      onChange={(e) => setFormData({ ...formData, trailerUrl: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Thể loại phim</label>
                    <input
                      type="text"
                      placeholder="VD: Hành động, Hài..."
                      value={formData.filmGenres}
                      onChange={(e) => setFormData({ ...formData, filmGenres: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Quốc gia</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Ngôn ngữ</label>
                    <input
                      type="text"
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Phân loại tuổi</label>
                    {/* CẬP NHẬT CHUẨN TUỔI MỚI (P, T13, T16, T18) */}
                    <select
                      value={formData.ageRating}
                      onChange={(e) => setFormData({ ...formData, ageRating: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-amber-500 outline-none cursor-pointer"
                    >
                      <option value="P">P (Mọi lứa tuổi)</option>
                      <option value="T13">T13 (13+)</option>
                      <option value="T16">T16 (16+)</option>
                      <option value="T18">T18 (18+)</option>
                    </select>
                  </div>

                  <div className="space-y-2" style={{ colorScheme: 'dark' }}>
                    <label className="text-sm font-bold text-slate-400">Ngày ra mắt</label>
                    <input
                      type="date"
                      value={formData.releaseDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          releaseDate: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-amber-500 outline-none cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2" style={{ colorScheme: 'dark' }}>
                    <label className="text-sm font-bold text-slate-400">Ngày kết thúc</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-amber-500 outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400">Mô tả Nội dung phim</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:border-amber-500 outline-none resize-none"
                  ></textarea>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end gap-4 bg-slate-900">
              <button
                onClick={() => setIsModalOpen(false)}
                type="button"
                className="px-6 py-2.5 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                HỦY BỎ
              </button>
              <button
                form="movieForm"
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-2.5 rounded-xl font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'CẬP NHẬT PHIM' : 'LƯU PHIM MỚI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMoviesPage;
