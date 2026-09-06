import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  const dbUrl = process.env.DATABASE_URL;
  let pool: Pool;
  
  if (dbUrl) {
    try {
      const parsedUrl = new URL(dbUrl);
      const sslParam = parsedUrl.searchParams.get("sslmode") || parsedUrl.searchParams.get("ssl");
      const useSsl = sslParam === "require" || sslParam === "true";

      pool = new Pool({
        host: parsedUrl.hostname,
        port: parsedUrl.port ? parseInt(parsedUrl.port) : 5432,
        database: parsedUrl.pathname.slice(1),
        user: parsedUrl.username,
        password: decodeURIComponent(parsedUrl.password),
        ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      });
    } catch (e) {
      console.warn("Prisma Client Pool fallback: invalid connection string format. Using raw URL.", e);
      pool = new Pool({ connectionString: dbUrl });
    }
  } else {
    pool = new Pool();
  }

  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
