import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const passwordHash =
  "$2b$12$zSqtGFiPjtfwWBVeFuhicOGucPX3U9YFRO/RnsX4eVqGkN/Cs7Fwy";

const users = [
  {
    email: "officer@example.com",
    fullName: "Verification Officer",
    role: "OFFICER",
  },
  {
    email: "owner@example.com",
    fullName: "Business Owner",
    role: "BUSINESS_OWNER",
  },
];

try {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        passwordHash,
        fullName: user.fullName,
        role: user.role,
        status: "ACTIVE",
      },
      create: {
        email: user.email,
        passwordHash,
        fullName: user.fullName,
        role: user.role,
        status: "ACTIVE",
      },
    });

    console.log(`Created/updated: ${user.email} (${user.role})`);
  }
} finally {
  await prisma.$disconnect();
}