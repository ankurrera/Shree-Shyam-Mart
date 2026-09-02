import app from './app.js';
import connectDB, { closeDB } from './configs/db.js';
import connectCloudinary from './configs/cloudinary.js';
import { validateEnv } from './configs/env.js';

// 1. Startup validation
validateEnv();

const port = process.env.PORT || 4000;

// 2. Initialize Database and Cloud Storage
await connectDB();
await connectCloudinary();

// 3. Start HTTP Server
const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`,'https://shree-shyam-mart-client.vercel.app');
});

// 4. Graceful Shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
        console.log('HTTP server closed.');
        try {
            await closeDB();
            console.log('PostgreSQL / Supabase connection pool closed.');
            process.exit(0);
        } catch (err) {
            console.error('Error closing database pool:', err.message);
            process.exit(1);
        }
    });

    // Force terminate if graceful shutdown hangs
    setTimeout(() => {
        console.error('Graceful shutdown timeout exceeded. Terminating process.');
        process.exit(1);
    }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
