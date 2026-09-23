import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const registerUser = async (
  email: string,
  password: string,
  fullName: string,
  birthDay: Date,
  phone: string,
) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: email },
    select: { id: true },
  });

  if (existingUser) {
    throw new Error('Email này đã tồn tại!');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email,
      birthDay: new Date(birthDay),
      phone,
      password: hashedPassword,
      fullName,
    },
  });

  const { password: _, ...userWithoutPassword } = newUser;

  return userWithoutPassword;
};

const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email: email } });

  if (!user) {
    throw new Error('Email không tồn tại!');
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error('Mật khẩu không hợp lệ!');
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET_KEY as string,
    { expiresIn: '1d' },
  );

  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
};

export { registerUser, loginUser };
