import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "../prisma";

export const userRepository = {
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  findById: (id: string) => prisma.user.findUnique({ where: { id } }),
  list: (query: string | undefined, role: UserRole | undefined, status: UserStatus | undefined, skip: number, take: number) => {
    const where = { ...(query ? { OR: [{ email: { contains: query } }, { fullName: { contains: query } }] } : {}), ...(role ? { role } : {}), ...(status ? { status } : {}) };
    return Promise.all([prisma.user.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, select: userSelect }), prisma.user.count({ where })]);
  },
  create: (data: { email: string; passwordHash: string; fullName: string; phone?: string; role: UserRole }) => prisma.user.create({ data, select: userSelect }),
  update: (id: string, data: { fullName?: string; phone?: string | null; role?: UserRole; status?: UserStatus }) => prisma.user.update({ where: { id }, data, select: userSelect }),
};

export const userSelect = { id: true, email: true, fullName: true, phone: true, role: true, status: true, createdAt: true, updatedAt: true, lastLoginAt: true } as const;