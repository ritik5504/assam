import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import "dotenv/config"; // Force load environment variables in dev environments

// Set WebSocket constructor for serverless Neon connections in Node.js environments
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

let prismaInstance = null;

function getPrismaInstance() {
  if (prismaInstance) return prismaInstance;

  const connectionString = process.env.DATABASE_URL;
  
  if (process.env.NODE_ENV === 'production') {
    if (connectionString) {
      const adapter = new PrismaNeon({ connectionString });
      prismaInstance = new PrismaClient({ adapter });
    } else {
      prismaInstance = new PrismaClient();
    }
  } else {
    if (!global.prisma) {
      if (connectionString) {
        const adapter = new PrismaNeon({ connectionString });
        global.prisma = new PrismaClient({ adapter });
      } else {
        global.prisma = new PrismaClient();
      }
    }
    prismaInstance = global.prisma;
  }
  
  return prismaInstance;
}

// Export a proxy to achieve lazy-loading of PrismaClient.
// This prevents build-time crashes when DATABASE_URL is missing or connection fails.
const prisma = new Proxy({}, {
  get(target, prop) {
    const instance = getPrismaInstance();
    const value = instance[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

export default prisma;
