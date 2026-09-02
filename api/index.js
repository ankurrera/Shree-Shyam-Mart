import app from '../server/app.js';
import connectDB from '../server/configs/db.js';
import connectCloudinary from '../server/configs/cloudinary.js';
import { validateEnv } from '../server/configs/env.js';

let initializationPromise;

async function initialize() {
    if (!initializationPromise) {
        initializationPromise = (async () => {
            validateEnv();
            await connectDB();
            await connectCloudinary();
        })();
    }

    await initializationPromise;
}

export default async function handler(req, res) {
    await initialize();
    return app(req, res);
}
