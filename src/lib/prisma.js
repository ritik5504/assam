import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import "dotenv/config"; // Force load environment variables in dev environments

// Set WebSocket constructor for serverless Neon connections in Node.js environments
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

let prisma;

if (process.env.NODE_ENV === 'production') {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    const adapter = new PrismaNeon({ connectionString });
    prisma = new PrismaClient({ adapter });
  } else {
    prisma = new PrismaClient();
  }
} else {
  if (!global.prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      const adapter = new PrismaNeon({ connectionString });
      global.prisma = new PrismaClient({ adapter });
    } else {
      global.prisma = new PrismaClient();
    }
  }
  prisma = global.prisma;
}

export default prisma;
