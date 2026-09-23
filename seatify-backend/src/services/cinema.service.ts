import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getAllCinemas = async () => {
  const cinemas = await prisma.cinema.findMany({
    include: {
      rooms: true,
    },

    orderBy: {
      name: 'asc',
    },
  });
  return cinemas;
};

export { getAllCinemas };
