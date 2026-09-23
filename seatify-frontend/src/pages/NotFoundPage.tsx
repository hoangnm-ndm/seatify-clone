import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
      <p className="text-xl mb-6">Trang này tìm không tồn tại.</p>
      <Link
        to="/"
        className="bg-yellow-400 text-black px-6 py-2 rounded font-bold hover:bg-yellow-500 transition"
      >
        Quay về Trang chủ
      </Link>
    </div>
  );
};

export default NotFoundPage;
