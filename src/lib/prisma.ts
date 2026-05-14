import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

/**
 * Prisma 7 expects a driver adapter. We only construct a client when `DATABASE_URL`
 * is set so `next build` and local dev without Neon still succeed.
 */
export function getPrisma(): PrismaClient | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  if (!globalForPrisma.prisma) {
    const pool = new Pool({ connectionString: url });
    globalForPrisma.pgPool = pool;
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}
