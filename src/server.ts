import dotenv from 'dotenv';
dotenv.config();
import { cleanupExpiredOrders } from "./services/orderCleanupService";
import { Server } from 'http';
import pool from './config/db';
import app from './index';

// Type definitions for environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      NODE_ENV?: 'development' | 'production' | 'test';
    }
  }
}

const PORT = Number(process.env.PORT) || 5000;
let server: Server;

// Graceful shutdown function
async function shutdown(signal: string) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Close HTTP server
  if (server) {
    console.log('Closing HTTP server...');
    await new Promise(resolve => server.close(resolve));
    console.log('HTTP server closed.');
  }

  // Close database connection
  try {
    console.log('Closing database connection...');
    await pool.end();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error closing database:', error);
  }

  console.log('Graceful shutdown completed.');
  process.exit(0);
}

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error(' Uncaught Exception:', error);
  shutdown('UNCAUGHT_EXCEPTION').catch(console.error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(' Unhandled Rejection at:', promise, 'reason:', reason);
});

// Shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM').catch(console.error));
process.on('SIGINT', () => shutdown('SIGINT').catch(console.error));

(async () => {
  try {
    await pool.connect();
    console.log(' Connected to PostgreSQL');

    server = app.listen(PORT, () => {
      console.log(` Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);

      // Start cleanup job
      setInterval(async () => {
        await cleanupExpiredOrders();
      }, 60000); // every 60 seconds

      console.log("🧹 Order cleanup scheduler started");
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(' Failed to connect to DB:', message);
    process.exit(1);
  }
})();